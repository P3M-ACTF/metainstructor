use axum::extract::{DefaultBodyLimit, Multipart};
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use meta_explain::{apply_explanations, glossary_json};
use metadissect::{
    analyze_buffer, analyze_html_string, analyze_json_string, AnalyzeOptions, Source,
};
use rust_embed::RustEmbed;
use serde::Deserialize;
use std::net::SocketAddr;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Assets;

pub fn is_headless() -> bool {
    if std::env::var("TERMUX_VERSION").is_ok() {
        return true;
    }
    if std::env::var("PREFIX")
        .map(|p| p.contains("com.termux"))
        .unwrap_or(false)
    {
        return true;
    }
    if std::env::var("CI").is_ok() || std::env::var("SSH_CONNECTION").is_ok() {
        return true;
    }
    #[cfg(unix)]
    {
        if std::env::var("DISPLAY").is_err() && std::env::var("WAYLAND_DISPLAY").is_err() {
            return true;
        }
    }
    false
}

pub async fn serve(host: &str, port: u16, open: bool) -> anyhow::Result<()> {
    if host == "0.0.0.0" || host == "::" || host == "[::]" {
        eprintln!(
            "WARNING: binding to {host} exposes the analyzer on the network with no authentication."
        );
    }
    let app = router();
    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let url = format!("http://{addr}");
    println!("MetaInstructor web UI: {url}");
    if open && !is_headless() {
        let _ = webbrowser::open(&url);
    } else if is_headless() {
        println!("Headless/Termux: open the URL in a browser. No desktop window will be launched.");
    }
    axum::serve(listener, app).await?;
    Ok(())
}

pub fn router() -> Router {
    Router::new()
        .route("/", get(index))
        .route("/api/health", get(health))
        .route("/api/glossary", get(glossary))
        .route("/api/analyze", post(analyze_upload))
        .route("/api/analyze-text", post(analyze_text))
        .route("/api/fetch", post(fetch_url))
        .route("/{*path}", get(static_file))
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024))
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

async fn analyze_upload(mut multipart: Multipart) -> Result<Json<serde_json::Value>, AppError> {
    if let Some(field) = multipart.next_field().await.map_err(AppError::bad)? {
        let name = field.file_name().unwrap_or("upload").to_string();
        let data = field.bytes().await.map_err(AppError::bad)?;
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
