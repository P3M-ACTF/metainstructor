use anyhow::Result;
use clap::{Parser, Subcommand, ValueEnum};
use meta_explain::apply_explanations;
use meta_ui::{maybe_print_banner, Product};
#[cfg(feature = "tui")]
use meta_ui::tui::{run_analyze_tui, should_use_analyze_tui};
use metadissect::export::{to_csv, to_json, to_markdown};
use metadissect::{analyze_html_string, analyze_json_string, analyze_path, AnalyzeOptions};
use std::path::{Path, PathBuf};

#[derive(Parser)]
#[command(
    name = "metainstructor",
    version,
    about = "Educational metadata viewer (CLI + web UI). Formerly MetaPeek. Default: serve."
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
    /// File to analyze (when not using a subcommand)
    path: Option<PathBuf>,
    #[arg(long, short = 'f', default_value = "table")]
    format: OutputFormat,
    #[arg(long, default_value = "127.0.0.1")]
    host: String,
    #[arg(long, default_value_t = 5173)]
    port: u16,
    /// Open a desktop browser when starting the UI. Ignored on Termux/headless.
    #[arg(long)]
    open: bool,
    #[arg(long)]
    no_banner: bool,
    #[arg(long, env = "META_SERVE_TOKEN")]
    token: Option<String>,
    #[arg(long)]
    retain_dir: Option<PathBuf>,
    #[arg(long, default_value_t = 3600)]
    retain_ttl: u64,
    #[arg(long)]
    no_tui: bool,
}

#[derive(Subcommand)]
enum Command {
    /// Analyze a local file
    Analyze {
        path: PathBuf,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
        #[arg(long)]
        no_tui: bool,
    },
    /// Analyze a pasted HTML document
    Html {
        #[arg(long)]
        file: Option<PathBuf>,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
        #[arg(long)]
        no_tui: bool,
    },
    /// Analyze a pasted JSON document
    Json {
        #[arg(long)]
        file: Option<PathBuf>,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
        #[arg(long)]
        no_tui: bool,
    },
    /// Fetch a public URL (SSRF-safe) and analyze it
    Fetch {
        url: String,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
        #[arg(long)]
        no_tui: bool,
    },
    /// Start the embedded web UI (Axum)
    Serve {
        #[arg(long, default_value = "127.0.0.1")]
        host: String,
        #[arg(long, default_value_t = 5173)]
        port: u16,
        #[arg(long)]
        open: bool,
        #[arg(long)]
        no_banner: bool,
        #[arg(long, env = "META_SERVE_TOKEN")]
        token: Option<String>,
        #[arg(long)]
        retain_dir: Option<PathBuf>,
        #[arg(long, default_value_t = 3600)]
        retain_ttl: u64,
    },
}

#[derive(Copy, Clone, ValueEnum)]
enum OutputFormat {
    Table,
    Json,
    Markdown,
    Csv,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Some(Command::Serve {
            host,
            port,
            open,
            no_banner,
            token,
            retain_dir,
            retain_ttl,
        }) => {
            metainstructor_web::serve(metainstructor_web::ServeConfig {
                host,
                port,
                open,
                no_banner,
                token,
                retain_dir,
                retain_ttl_secs: Some(retain_ttl),
            })
            .await?;
        }
        Some(Command::Analyze { path, format, no_tui }) => {
            print_analysis_path(&path, format, no_tui)?;
        }
        Some(Command::Html { file, format, no_tui }) => {
            let name = file
                .as_ref()
                .and_then(|p| p.file_name())
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .or_else(|| Some("stdin.html".into()));
            let html = read_or_stdin(file)?;
            let mut a = analyze_html_string(&html, name);
            apply_explanations(&mut a);
            print_analysis(&a, format, no_tui)?;
        }
        Some(Command::Json { file, format, no_tui }) => {
            let name = file
                .as_ref()
                .and_then(|p| p.file_name())
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .or_else(|| Some("stdin.json".into()));
            let json = read_or_stdin(file)?;
            let mut a = analyze_json_string(&json, name);
            apply_explanations(&mut a);
            print_analysis(&a, format, no_tui)?;
        }
        Some(Command::Fetch { url, format, no_tui }) => {
            let mut a = metadissect::fetch::fetch_and_analyze(&url).await?;
            apply_explanations(&mut a);
            print_analysis(&a, format, no_tui)?;
        }
        None => {
            if let Some(path) = cli.path {
                print_analysis_path(&path, cli.format, cli.no_tui)?;
            } else {
                metainstructor_web::serve(metainstructor_web::ServeConfig {
                    host: cli.host,
                    port: cli.port,
                    open: cli.open,
                    no_banner: cli.no_banner,
                    token: cli.token,
                    retain_dir: cli.retain_dir,
                    retain_ttl_secs: Some(cli.retain_ttl),
                })
                .await?;
            }
        }
    }
    Ok(())
}

fn print_analysis_path(path: &Path, format: OutputFormat, no_tui: bool) -> Result<()> {
    let mut a = analyze_path(path)?;
    apply_explanations(&mut a);
    print_analysis(&a, format, no_tui)
}

fn print_analysis(a: &metadissect::Analysis, format: OutputFormat, no_tui: bool) -> Result<()> {
    maybe_print_banner(Product::Metainstructor, false);
    let structured = !matches!(format, OutputFormat::Table);
    #[cfg(feature = "tui")]
    if should_use_analyze_tui(structured, no_tui) {
        run_analyze_tui(a)?;
        return Ok(());
    }
    match format {
        OutputFormat::Json => println!("{}", to_json(a)?),
        OutputFormat::Csv => print!("{}", to_csv(a)),
        OutputFormat::Markdown => print!("{}", to_markdown(a)),
        OutputFormat::Table => print_table(a),
    }
    Ok(())
}

fn print_table(a: &metadissect::Analysis) {
    println!(
        "MetaInstructor  {}  {}  {} bytes  entropy={:.3}",
        a.filename.as_deref().unwrap_or("-"),
        a.mime,
        a.size,
        a.entropy
    );
    println!("SHA-256 {}  MD5 {}", a.hashes.sha256, a.hashes.md5);
    println!();
    for sec in &a.sections {
        println!("── {} ──", sec.label);
        for f in &sec.fields {
            let ns = f.namespace.as_deref().unwrap_or("");
            let val = metadissect::truncate_chars(&f.value, 120);
            if ns.is_empty() {
                println!("  {:28} {}", f.key, val);
            } else {
                println!("  {:28} {}  [{}]", f.key, val, ns);
            }
        }
        println!();
    }
    if !a.warnings.is_empty() {
        println!("── Warnings ──");
        for w in &a.warnings {
            println!("  ! {w}");
        }
    }
    if !a.notes_educativas.is_empty() {
        println!("── Notes ──");
        for n in &a.notes_educativas {
            println!("  · {n}");
        }
    }
    let _ = AnalyzeOptions::default();
}

fn read_or_stdin(file: Option<PathBuf>) -> Result<String> {
    if let Some(p) = file {
        Ok(std::fs::read_to_string(p)?)
    } else {
        use std::io::Read;
        let mut s = String::new();
        std::io::stdin().read_to_string(&mut s)?;
        Ok(s)
    }
}
