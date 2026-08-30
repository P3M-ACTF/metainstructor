use axum::extract::{DefaultBodyLimit, Multipart, State};
use axum::http::{header, HeaderValue, Request, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use meta_explain::{apply_explanations, glossary_json};
use meta_ui::{
    check_serve_token, is_headless_env, is_tty_stdio, maybe_print_banner,
    query_token_param, shell_css, shell_css_mime,
    shell_js, shell_js_mime, Product, RetainConfig, RetainStore, ServeStats,
};
use metadissect::{
    analyze_buffer, analyze_html_string, analyze_json_string, AnalyzeOptions, Source,
};
use rust_embed::RustEmbed;
use serde::Deserialize;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

#[cfg(feature = "tui")]
use meta_ui::tui::{run_serve_dashboard, ServeDashboardOptions};

#[derive(RustEmbed)]
#[folder = "static/"]
struct Assets;

pub struct ServeConfig {
    pub host: String,
    pub port: u16,
    pub open: bool,
    pub no_banner: bool,
    pub token: Option<String>,
    pub retain_dir: Option<std::path::PathBuf>,
    pub retain_ttl_secs: Option<u64>,
}

pub async fn serve(cfg: ServeConfig) -> anyhow::Result<()> {
    maybe_print_banner(Product::Metainstructor, cfg.no_banner);
    meta_ui::warn_remote_bind(&cfg.host);

    let token = cfg
        .token
        .or_else(|| std::env::var("META_SERVE_TOKEN").ok());
    let auth = ServeAuth {
        host: cfg.host.clone(),
        token,
    };
    let retain = Arc::new(RetainStore::new(
        RetainConfig::new(
            cfg.retain_dir.unwrap_or_default(),
            cfg.retain_ttl_secs.unwrap_or(3600),
        ),
    ));
    let stats = Arc::new(ServeStats::new());
    let stop = Arc::new(AtomicBool::new(false));

    let app = router(retain.clone())
        .layer(middleware::from_fn_with_state(
            stats.clone(),
            record_stats_middleware,
        ))
        .layer(middleware::from_fn_with_state(auth, auth_middleware))
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024));

    let addr: SocketAddr = format!("{}:{}", cfg.host, cfg.port).parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let url = format!("http://{addr}");

    let stop_serve = stop.clone();
    let stop_after = stop.clone();
    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                while !stop_serve.load(Ordering::Relaxed) {
                    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                }
            })
            .await
        {
            eprintln!("serve error: {e}");
        }
        stop_after.store(true, Ordering::Relaxed);
    });

    let interactive = is_tty_stdio() && !is_headless_env();
    if interactive {
        println!("MetaInstructor web UI: {url}");
        #[cfg(feature = "tui")]
        {
            let stats_dash = stats.clone();
            let stop_dash = stop.clone();
            let dash_url = url.clone();
            tokio::task::spawn_blocking(move || {
                let _ = run_serve_dashboard(
                    stats_dash,
                    stop_dash,
                    ServeDashboardOptions {
                        title: "MetaInstructor".into(),
                        url: dash_url,
                    },
                );
            });
        }
        #[cfg(not(feature = "tui"))]
        println!("Press Ctrl+C to stop.");
    } else {
        println!("{url}");
        if is_headless_env() {
            println!("Headless/Termux: open the URL in a browser.");
        }
    }

    if cfg.open && !is_headless_env() {
        let _ = webbrowser::open(&url);
    }

    while !stop.load(Ordering::Relaxed) {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    Ok(())
}

async fn record_stats_middleware(
    State(stats): State<Arc<ServeStats>>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let route = req.uri().path().to_string();
    let start = Instant::now();
    let res = next.run(req).await;
    stats.record(&route, res.status().as_u16(), start.elapsed());
    res
}

#[derive(Clone)]
struct ServeAuth {
    host: String,
    token: Option<String>,
}

async fn auth_middleware(
    State(auth): State<ServeAuth>,
    headers: axum::http::HeaderMap,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let provided = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok());
    let query_token = query_token_param(req.uri().query());
    if check_serve_token(
        &auth.host,
        auth.token.as_deref(),
        provided,
        query_token,
    )
    .is_err()
    {
        return (StatusCode::UNAUTHORIZED, "unauthorized").into_response();
    }
    next.run(req).await
}

pub fn router(retain: Arc<RetainStore>) -> Router {
    Router::new()
        .route("/", get(index))
        .route("/meta-ui/shell.css", get(shell_css_handler))
        .route("/meta-ui/shell.js", get(shell_js_handler))
        .route("/api/health", get(health))
        .route("/api/glossary", get(glossary))
        .route("/api/retained", get(retained_list))
        .route("/api/analyze", post(analyze_upload))
        .route("/api/analyze-text", post(analyze_text))
        .route("/api/fetch", post(fetch_url))
        .route("/{*path}", get(static_file))
        .with_state(AppState { retain })
}

#[derive(Clone)]
struct AppState {
    retain: Arc<RetainStore>,
}

async fn shell_css_handler() -> impl IntoResponse {
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, HeaderValue::from_static(shell_css_mime()))],
        shell_css(),
    )
}

async fn shell_js_handler() -> impl IntoResponse {
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, HeaderValue::from_static(shell_js_mime()))],
        shell_js(),
    )
}

async fn index() -> impl IntoResponse {
    static_named("index.html")
}

async fn static_file(axum::extract::Path(path): axum::extract::Path<String>) -> Response {
    static_named(&path)
}

fn static_named(path: &str) -> Response {
    match Assets::get(path) {
        Some(file) => {
            let mime = mime_guess(path);
            (
                StatusCode::OK,
                [(header::CONTENT_TYPE, HeaderValue::from_static(mime))],
                file.data.to_vec(),
            )
                .into_response()
        }
        None => {
            if path != "index.html" {
                if let Some(file) = Assets::get("index.html") {
                    return Html(String::from_utf8_lossy(&file.data).into_owned()).into_response();
                }
            }
            (StatusCode::NOT_FOUND, "not found").into_response()
        }
    }
}

fn mime_guess(path: &str) -> &'static str {
    if path.ends_with(".js") {
        "application/javascript; charset=utf-8"
    } else if path.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else {
        "text/html; charset=utf-8"
    }
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "ok": true, "name": "metainstructor" }))
}

async fn glossary() -> Json<serde_json::Value> {
    Json(glossary_json())
}

async fn retained_list(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Json<serde_json::Value> {
    let session = session_id(&headers);
    let items = state.retain.list_session(&session);
    Json(serde_json::json!({ "session": session, "items": items }))
}

fn session_id(headers: &axum::http::HeaderMap) -> String {
    if let Some(v) = headers.get("x-meta-session").and_then(|h| h.to_str().ok()) {
        return v.to_string();
    }
    if let Some(cookie) = headers.get(header::COOKIE).and_then(|h| h.to_str().ok()) {
        for part in cookie.split(';') {
            let part = part.trim();
            if let Some(id) = part.strip_prefix("meta_session=") {
                return id.to_string();
            }
        }
    }
    "default".to_string()
}

async fn analyze_upload(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    if let Some(field) = multipart.next_field().await.map_err(AppError::bad)? {
        let name = field.file_name().unwrap_or("upload").to_string();
        let data = field.bytes().await.map_err(AppError::bad)?;
        let session = session_id(&headers);
        state.retain.store(&session, &name, &data);
        let mut analysis = analyze_buffer(&data, AnalyzeOptions::from_filename(name));
        apply_explanations(&mut analysis);
        return Ok(Json(serde_json::to_value(analysis).map_err(AppError::bad)?));
    }
    Err(AppError::bad("missing file"))
}

#[derive(Deserialize)]
struct TextReq {
    text: String,
    #[serde(default)]
    kind: Option<String>,
    #[serde(default)]
    filename: Option<String>,
}

async fn analyze_text(Json(req): Json<TextReq>) -> Result<Json<serde_json::Value>, AppError> {
    let kind = req.kind.unwrap_or_else(|| "html".into());
    let mut analysis = if kind == "json" {
        analyze_json_string(&req.text, req.filename)
    } else {
        analyze_html_string(&req.text, req.filename)
    };
    analysis.source = if kind == "json" {
        Source::Json
    } else {
        Source::Html
    };
    apply_explanations(&mut analysis);
    Ok(Json(serde_json::to_value(analysis).map_err(AppError::bad)?))
}

#[derive(Deserialize)]
struct FetchReq {
    url: String,
}

async fn fetch_url(Json(req): Json<FetchReq>) -> Result<Json<serde_json::Value>, AppError> {
    let mut analysis = metadissect::fetch::fetch_and_analyze(&req.url)
        .await
        .map_err(AppError::bad)?;
    apply_explanations(&mut analysis);
    Ok(Json(serde_json::to_value(analysis).map_err(AppError::bad)?))
}

struct AppError {
    status: StatusCode,
    msg: String,
}

impl AppError {
    fn bad(err: impl ToString) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            msg: err.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, Json(serde_json::json!({ "error": self.msg }))).into_response()
    }
}
