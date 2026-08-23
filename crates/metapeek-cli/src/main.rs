use anyhow::Result;
use clap::{Parser, Subcommand, ValueEnum};
use meta_core::export::{to_csv, to_json, to_markdown};
use meta_core::{analyze_html_string, analyze_json_string, analyze_path, AnalyzeOptions};
use meta_explain::apply_explanations;
use std::path::{Path, PathBuf};

#[derive(Parser)]
#[command(
    name = "metapeek",
    version,
    about = "Exhaustive local metadata analysis (CLI + embedded web)."
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
    /// File to analyze (when not using a subcommand)
    path: Option<PathBuf>,
    #[arg(long, short = 'f', default_value = "table")]
    format: OutputFormat,
}

#[derive(Subcommand)]
enum Command {
    /// Analyze a local file
    Analyze {
        path: PathBuf,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
    },
    /// Analyze a pasted HTML document
    Html {
        #[arg(long)]
        file: Option<PathBuf>,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
    },
    /// Analyze a pasted JSON document
    Json {
        #[arg(long)]
        file: Option<PathBuf>,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
    },
    /// Fetch a public URL (SSRF-safe) and analyze it
    Fetch {
        url: String,
        #[arg(long, short = 'f', default_value = "table")]
        format: OutputFormat,
    },
    /// Start the embedded web UI (Axum)
    Serve {
        #[arg(long, default_value = "127.0.0.1")]
        host: String,
        #[arg(long, default_value_t = 5173)]
        port: u16,
        /// Open a desktop browser. Ignored on Termux/headless.
        #[arg(long)]
        open: bool,
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
        Some(Command::Serve { host, port, open }) => {
            warn_bind(&host);
            metapeek_web::serve(&host, port, open).await?;
        }
        Some(Command::Analyze { path, format }) => print_analysis_path(&path, format)?,
        Some(Command::Html { file, format }) => {
            let name = file
                .as_ref()
                .and_then(|p| p.file_name())
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .or_else(|| Some("stdin.html".into()));
            let html = read_or_stdin(file)?;
            let mut a = analyze_html_string(&html, name);
            apply_explanations(&mut a);
            print_analysis(&a, format)?;
        }
        Some(Command::Json { file, format }) => {
            let name = file
                .as_ref()
                .and_then(|p| p.file_name())
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .or_else(|| Some("stdin.json".into()));
            let json = read_or_stdin(file)?;
            let mut a = analyze_json_string(&json, name);
            apply_explanations(&mut a);
            print_analysis(&a, format)?;
        }
        Some(Command::Fetch { url, format }) => {
            let mut a = meta_core::fetch::fetch_and_analyze(&url).await?;
            apply_explanations(&mut a);
            print_analysis(&a, format)?;
        }
        None => {
            let path = cli.path.ok_or_else(|| {
                anyhow::anyhow!("pass a file path or a subcommand (analyze, serve, fetch)")
            })?;
            print_analysis_path(&path, cli.format)?;
        }
    }
    Ok(())
}

fn print_analysis_path(path: &Path, format: OutputFormat) -> Result<()> {
    let mut a = analyze_path(path)?;
    apply_explanations(&mut a);
    print_analysis(&a, format)
}

fn print_analysis(a: &meta_core::Analysis, format: OutputFormat) -> Result<()> {
    match format {
        OutputFormat::Json => println!("{}", to_json(a)?),
        OutputFormat::Csv => print!("{}", to_csv(a)),
        OutputFormat::Markdown => print!("{}", to_markdown(a)),
        OutputFormat::Table => print_table(a),
    }
    Ok(())
}

fn print_table(a: &meta_core::Analysis) {
    println!(
        "MetaPeek  {}  {}  {} bytes  entropy={:.3}",
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
            let val = meta_core::truncate_chars(&f.value, 120);
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
    let _ = AnalyzeOptions::default();
}

fn warn_bind(host: &str) {
    if host == "0.0.0.0" || host == "::" || host == "[::]" {
        eprintln!(
            "WARNING: binding to {host} exposes the analyzer on the network with no authentication."
        );
    }
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
