use crate::analyze::analyze_buffer;
use crate::error::{MetaError, Result};
use crate::types::{AnalyzeOptions, Source};
use std::net::IpAddr;
use url::Url;

const MAX_BYTES: u64 = 50 * 1024 * 1024;
const TIMEOUT_SECS: u64 = 15;

pub async fn fetch_and_analyze(url: &str) -> Result<crate::types::Analysis> {
    let parsed = Url::parse(url).map_err(|e| MetaError::Fetch(e.to_string()))?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err(MetaError::BlockedUrl(format!(
            "scheme {} is not allowed",
            parsed.scheme()
        )));
    }
    if let Some(host) = parsed.host_str() {
        reject_host(host)?;
    }

    let client = reqwest::Client::builder()
        .use_rustls_tls()
        .timeout(std::time::Duration::from_secs(TIMEOUT_SECS))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| MetaError::Fetch(e.to_string()))?;

    let response = client
        .get(parsed.as_str())
        .send()
        .await
        .map_err(|e| MetaError::Fetch(e.to_string()))?;

    if let Some(remote) = response.remote_addr() {
        reject_ip(remote.ip())?;
    }

    let headers: Vec<(String, String)> = response
        .headers()
        .iter()
        .map(|(k, v)| {
            (
                k.to_string(),
                v.to_str().unwrap_or("").to_string(),
            )
        })
        .collect();

    let mime_hint = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(';').next().unwrap_or(s).trim().to_string());

    let bytes = response
        .bytes()
        .await
        .map_err(|e| MetaError::Fetch(e.to_string()))?;
    if bytes.len() as u64 > MAX_BYTES {
        return Err(MetaError::TooLarge {
            size: bytes.len() as u64,
            limit: MAX_BYTES,
        });
    }

    let filename = parsed
        .path_segments()
        .and_then(|s| s.last())
        .filter(|s| !s.is_empty())
        .unwrap_or("download")
        .to_string();

    let mut options = AnalyzeOptions::from_filename(filename.clone());
    options.source = Some(Source::Url);
    options.source_url = Some(parsed.to_string());
    options.response_headers = headers;
    if mime_hint.is_some() && !filename.contains('.') {
        options.filename = Some("download".into());
    }
    Ok(analyze_buffer(&bytes, options))
}

fn reject_host(host: &str) -> Result<()> {
    let h = host.to_ascii_lowercase();
    if h == "localhost" || h.ends_with(".localhost") || h.ends_with(".local") {
        return Err(MetaError::BlockedUrl(host.into()));
    }
    if let Ok(ip) = h.parse::<IpAddr>() {
        reject_ip(ip)?;
    }
    Ok(())
}

fn reject_ip(ip: IpAddr) -> Result<()> {
    if ip.is_loopback() || ip.is_unspecified() || ip.is_multicast() {
        return Err(MetaError::BlockedUrl(ip.to_string()));
    }
    match ip {
        IpAddr::V4(v4) => {
            if v4.is_private() || v4.is_link_local() || v4.octets()[0] == 169 && v4.octets()[1] == 254
            {
                return Err(MetaError::BlockedUrl(ip.to_string()));
            }
            // CGNAT 100.64.0.0/10
            if v4.octets()[0] == 100 && (v4.octets()[1] & 0xC0) == 64 {
                return Err(MetaError::BlockedUrl(ip.to_string()));
            }
        }
        IpAddr::V6(v6) => {
            if v6.is_unique_local() {
                return Err(MetaError::BlockedUrl(ip.to_string()));
            }
        }
    }
    Ok(())
}
