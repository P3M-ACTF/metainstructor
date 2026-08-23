use crate::parsers::xmp;
use crate::types::{Field, Section};
use std::io::{Cursor, Read};
use zip::ZipArchive;

pub fn is_office_mime(mime: &str) -> bool {
    mime.contains("officedocument")
        || mime.contains("opendocument")
        || mime.contains("msword")
        || mime.contains("ms-excel")
        || mime.contains("ms-powerpoint")
        || mime == "application/rtf"
        || mime.ends_with("epub+zip")
}

pub fn parse_office(data: &[u8], mime: &str) -> (Vec<Section>, Vec<String>) {
    if mime.contains("rtf") || data.starts_with(b"{\\rtf") {
        return parse_rtf(data);
    }
    parse_zip_xml_package(data)
}

pub fn parse_zip_xml_package(data: &[u8]) -> (Vec<Section>, Vec<String>) {
    let mut sections = Vec::new();
    let mut warnings = Vec::new();
    let cursor = Cursor::new(data);
    let mut zip = match ZipArchive::new(cursor) {
        Ok(z) => z,
        Err(err) => {
            warnings.push(format!("ZIP/Office: {err}"));
            return (sections, warnings);
        }
    };

    let mut listing = Section::new("zip-entries", "Package entries");
    listing.add("EntryCount", zip.len().to_string(), Some("ZIP"));
    if !zip.comment().is_empty() {
        listing.add(
            "Comment",
            String::from_utf8_lossy(zip.comment()).into_owned(),
            Some("ZIP"),
        );
    }

    let interesting = [
        "docProps/core.xml",
        "docProps/app.xml",
        "docProps/custom.xml",
        "meta.xml",
        "[Content_Types].xml",
        "META-INF/container.xml",
        "mimetype",
    ];

    for i in 0..zip.len() {
        let mut file = match zip.by_index(i) {
            Ok(f) => f,
            Err(_) => continue,
        };
        let name = file.name().to_string();
        listing.fields.push(
            Field::new(name.clone(), format!("{} bytes", file.size())).with_namespace("ZIP"),
        );
        let wanted = interesting.iter().any(|p| name == *p)
            || name.ends_with(".opf")
            || name.contains("metadata");
        if !wanted || file.size() > 2_000_000 {
            continue;
        }
        let mut buf = Vec::new();
        if file.read_to_end(&mut buf).is_err() {
            continue;
        }
        if name == "mimetype" {
            let mut s = Section::new("epub-mimetype", "Package mimetype");
            s.add(
                "Mimetype",
                String::from_utf8_lossy(&buf).trim().to_string(),
                Some("EPUB"),
            );
            sections.push(s);
            continue;
        }
        if name.ends_with(".xml") || name.ends_with(".opf") {
            let xml = String::from_utf8_lossy(&buf);
            let ns = if name.contains("core") {
                "Office:core"
            } else if name.contains("app") {
                "Office:app"
            } else if name.contains("custom") {
                "Office:custom"
            } else if name.contains("meta.xml") {
                "ODF:meta"
            } else if name.ends_with(".opf") {
                "EPUB:OPF"
            } else {
                "Office:xml"
            };
            let mut sec = flatten_xml(&xml, ns, &name);
            if name.contains("core") {
                sec.id = "office-core".into();
                sec.label = "Office core.xml".into();
            } else if name.contains("app.xml") {
                sec.id = "office-app".into();
                sec.label = "Office app.xml".into();
            } else if name.contains("custom") {
                sec.id = "office-custom".into();
                sec.label = "Office custom.xml".into();
            } else if name.ends_with(".opf") {
                sec.id = "epub-opf".into();
                sec.label = "EPUB OPF".into();
            }
            if !sec.is_empty() {
                sections.push(sec);
            }
            if let Some(x) = xmp::extract_xmp_from_bytes(&buf) {
                let xs = xmp::parse_xmp(&x, "XMP");
                if !xs.is_empty() {
                    sections.push(xs);
                }
            }
        }
    }
    sections.insert(0, listing);
    (sections, warnings)
}

fn flatten_xml(xml: &str, ns: &str, origin: &str) -> Section {
    use quick_xml::events::Event;
    use quick_xml::Reader;
    let mut section = Section::new("xml-meta", origin);
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);
    let mut stack: Vec<String> = Vec::new();
    let mut buf = Vec::new();
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let local = name.rsplit(':').next().unwrap_or(&name).to_string();
                for attr in e.attributes().flatten() {
                    let an = String::from_utf8_lossy(attr.key.as_ref()).into_owned();
                    let av = attr.unescape_value().map(|v| v.into_owned()).unwrap_or_default();
                    if !av.is_empty() && !an.contains("xmlns") {
                        section.fields.push(
                            Field::new(format!("{local}@{}", an.rsplit(':').next().unwrap_or(&an)), av)
                                .with_namespace(ns),
                        );
                    }
                }
                stack.push(local);
            }
            Ok(Event::Empty(e)) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let local = name.rsplit(':').next().unwrap_or(&name).to_string();
                for attr in e.attributes().flatten() {
                    let an = String::from_utf8_lossy(attr.key.as_ref()).into_owned();
                    let av = attr.unescape_value().map(|v| v.into_owned()).unwrap_or_default();
                    if !av.is_empty() {
                        section.fields.push(
                            Field::new(format!("{local}@{}", an.rsplit(':').next().unwrap_or(&an)), av)
                                .with_namespace(ns),
                        );
                    }
                }
            }
            Ok(Event::Text(t)) => {
                if let Ok(text) = t.unescape() {
                    let text = text.trim();
                    if !text.is_empty() {
                        let key = stack.last().cloned().unwrap_or_else(|| "value".into());
                        section
                            .fields
                            .push(Field::new(key, text.to_string()).with_namespace(ns));
                    }
                }
            }
            Ok(Event::End(_)) => {
                stack.pop();
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => {}
        }
        buf.clear();
    }
    section
}

fn parse_rtf(data: &[u8]) -> (Vec<Section>, Vec<String>) {
    let text = String::from_utf8_lossy(data);
    let mut sec = Section::new("rtf", "RTF info");
    for key in [
        "title",
        "author",
        "company",
        "operator",
        "creatim",
        "revtim",
        "printim",
        "version",
        "edmins",
        "nofpages",
        "nofwords",
        "manager",
        "subject",
        "keywords",
        "comment",
    ] {
        let pat = format!("\\{key}");
        if let Some(idx) = text.find(&pat) {
            let rest = &text[idx + pat.len()..];
            let val = take_rtf_value(rest);
            if !val.is_empty() {
                sec.add(key, val, Some("RTF"));
            }
        }
    }
    (vec![sec], Vec::new())
}

fn take_rtf_value(s: &str) -> String {
    let s = s.trim_start();
    if let Some(stripped) = s.strip_prefix('{') {
        return stripped.split('}').next().unwrap_or("").replace('\\', "").trim().to_string();
    }
    s.split(|c: char| c == '\\' || c == '{' || c == '}')
        .next()
        .unwrap_or("")
        .trim()
        .to_string()
}
