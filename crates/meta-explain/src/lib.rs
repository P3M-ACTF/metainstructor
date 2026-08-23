use meta_core::types::{Analysis, Field};

pub struct GlossaryEntry {
    pub keys: &'static [&'static str],
    pub title_es: &'static str,
    pub title_en: &'static str,
    pub body_es: &'static str,
    pub body_en: &'static str,
}

pub const GLOSSARY: &[GlossaryEntry] = &[
    GlossaryEntry {
        keys: &["DateTimeOriginal", "DateTimeDigitized", "DateTime"],
        title_es: "Fechas EXIF",
        title_en: "EXIF dates",
        body_es: "DateTimeOriginal es el instante en que el sensor capturó la foto. DateTimeDigitized es cuando se digitalizó. DateTime (IFD0) suele ser la última modificación del archivo. Si discrepan, el archivo pudo editarse o copiarse.",
        body_en: "DateTimeOriginal is when the sensor captured the photo. DateTimeDigitized is conversion time. IFD0 DateTime is often last file change. Conflicts can indicate edits or copies.",
    },
    GlossaryEntry {
        keys: &["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSMapDatum"],
        title_es: "GPS",
        title_en: "GPS",
        body_es: "Coordenadas del receptor, no siempre del lugar real (pueden clonarse). El datum (WGS-84) define el elipsoide. AltitudeRef 0 = sobre el nivel del mar.",
        body_en: "Receiver coordinates — they can be cloned. Datum (WGS-84) defines the ellipsoid. AltitudeRef 0 means above sea level.",
    },
    GlossaryEntry {
        keys: &["Make", "Model", "LensModel", "BodySerialNumber", "LensSerialNumber"],
        title_es: "Cámara y lente",
        title_en: "Camera and lens",
        body_es: "Identifican el hardware. Los números de serie son identificadores persistentes y pueden correlacionar fotos de la misma cámara.",
        body_en: "Identify hardware. Serial numbers persist and can correlate photos from the same body.",
    },
    GlossaryEntry {
        keys: &["Software", "CreatorTool", "Producer", "Application", "WritingApp", "MuxingApp"],
        title_es: "Software",
        title_en: "Software",
        body_es: "Qué programa escribió o retocó el archivo (Photoshop, Lightroom, exportadores móviles, FFmpeg…). Útil para procedencia.",
        body_en: "Which program wrote or edited the file. Useful for provenance.",
    },
    GlossaryEntry {
        keys: &["Artist", "Byline", "creator", "Author", "LastModifiedBy", "creator"],
        title_es: "Autoría",
        title_en: "Authorship",
        body_es: "Nombre incrustado por la cámara, el revelado o Office. No prueba identidad legal por sí solo.",
        body_en: "Name embedded by camera, raw developer or Office. Not legal identity by itself.",
    },
    GlossaryEntry {
        keys: &["Orientation"],
        title_es: "Orientación",
        title_en: "Orientation",
        body_es: "Cómo rotar los píxeles al mostrar. 1 = normal; 6 = 90° CW. El visor y el valor EXIF pueden no coincidir si se reencuadró.",
        body_en: "How to rotate pixels. 1 = normal; 6 = 90° CW. Viewer and EXIF can disagree after a crop.",
    },
    GlossaryEntry {
        keys: &["PixelXDimension", "PixelYDimension", "ImageWidth", "ImageLength", "Width", "Height"],
        title_es: "Dimensiones",
        title_en: "Dimensions",
        body_es: "EXIF puede declarar un tamaño distinto al de los píxeles reales (SOF JPEG / IHDR PNG). Esa discrepancia es una anomalía clásica de reedición.",
        body_en: "EXIF size can differ from real pixels (JPEG SOF / PNG IHDR). That mismatch is a classic re-edit anomaly.",
    },
    GlossaryEntry {
        keys: &["ExposureTime", "FNumber", "PhotographicSensitivity", "ISO", "FocalLength", "Flash"],
        title_es: "Exposición",
        title_en: "Exposure",
        body_es: "Triángulo de exposición y focal. Valores imposibles para el modelo declarado merecen revisión.",
        body_en: "Exposure triangle and focal length. Impossible values for the declared model deserve review.",
    },
    GlossaryEntry {
        keys: &["UserComment", "ImageDescription", "CaptionAbstract", "Keywords"],
        title_es: "Texto embebido",
        title_en: "Embedded text",
        body_es: "Comentarios EXIF/IPTC. A veces contienen rutas de disco, nombres de proyecto o copias de trabajo.",
        body_en: "EXIF/IPTC comments. Sometimes contain disk paths, project names or working copies.",
    },
    GlossaryEntry {
        keys: &["Producer", "Creator", "CreationDate", "ModDate"],
        title_es: "PDF Info",
        title_en: "PDF Info",
        body_es: "Diccionario Info del PDF. Producer suele ser el motor (Word, LaTeX, wkhtmltopdf). Varios %%EOF indican actualizaciones incrementales.",
        body_en: "PDF Info dictionary. Producer is often the engine. Multiple %%EOF mark incremental updates.",
    },
    GlossaryEntry {
        keys: &["Title", "Artist", "Album", "Genre", "TPE1", "TIT2"],
        title_es: "ID3 / audio",
        title_en: "ID3 / audio",
        body_es: "Etiquetas ID3v1/v2, Vorbis o atoms ilst. ID3v2 puede llevar carátulas binarias y frames privados.",
        body_en: "ID3v1/v2, Vorbis or ilst atoms. ID3v2 may carry artwork and private frames.",
    },
    GlossaryEntry {
        keys: &["CreationTime", "ModificationTime", "Timescale"],
        title_es: "Tiempo de contenedor",
        title_en: "Container time",
        body_es: "En MP4 las fechas mvhd parten de 1904-01-01 (Mac epoch). Pueden no coincidir con el sistema de archivos.",
        body_en: "MP4 mvhd dates start at 1904-01-01 (Mac epoch). They may disagree with filesystem times.",
    },
    GlossaryEntry {
        keys: &["og:title", "twitter:card", "canonical"],
        title_es: "Metadatos web",
        title_en: "Web metadata",
        body_es: "Open Graph y Twitter Cards describen cómo se comparte un enlace. canonical indica la URL preferida.",
        body_en: "Open Graph and Twitter Cards describe link previews. canonical is the preferred URL.",
    },
    GlossaryEntry {
        keys: &["MD5", "SHA-1", "SHA-256", "SHA-512", "BLAKE3"],
        title_es: "Hashes",
        title_en: "Hashes",
        body_es: "Huellas del archivo completo. SHA-256 y BLAKE3 son las recomendadas para inventario. MD5/SHA-1 siguen usándose en informes legacy.",
        body_en: "Fingerprints of the whole file. Prefer SHA-256 and BLAKE3 for inventories.",
    },
    GlossaryEntry {
        keys: &["Entropy"],
        title_es: "Entropía",
        title_en: "Entropy",
        body_es: "Aleatoriedad media (0–8 bits/byte). Cerca de 8 sugiere cifrado o compresión fuerte; valores bajos, texto o relleno.",
        body_en: "Average randomness (0–8 bits/byte). Near 8 suggests encryption or strong compression; low values suggest text or padding.",
    },
];

pub fn explanation_for(key: &str) -> Option<(String, String)> {
    let k = key.rsplit([':', '.', '/']).next().unwrap_or(key);
    for e in GLOSSARY {
        if e.keys.iter().any(|cand| cand.eq_ignore_ascii_case(k) || cand.eq_ignore_ascii_case(key)) {
            return Some((
                format!("{} / {}", e.title_es, e.title_en),
                format!("{}\n\n{}", e.body_es, e.body_en),
            ));
        }
    }
    None
}

pub fn apply_explanations(analysis: &mut Analysis) {
    for section in &mut analysis.sections {
        for field in &mut section.fields {
            if field.explanation.is_none() {
                if let Some((title, body)) = explanation_for(&field.key) {
                    field.explanation = Some(format!("{title}\n{body}"));
                }
            }
        }
    }
    if analysis.notes_educativas.is_empty() {
        analysis.notes_educativas.push(
            "MetaPeek muestra todas las etiquetas que el parser lee; no hay lista blanca. Un campo ausente no implica que no existiera: pudo borrarse al exportar.".into(),
        );
    }
}

pub fn enrich_field(field: &mut Field) {
    if field.explanation.is_none() {
        if let Some((title, body)) = explanation_for(&field.key) {
            field.explanation = Some(format!("{title}\n{body}"));
        }
    }
}

pub fn glossary_json() -> serde_json::Value {
    serde_json::json!(GLOSSARY
        .iter()
        .map(|e| {
            serde_json::json!({
                "keys": e.keys,
                "title_es": e.title_es,
                "title_en": e.title_en,
                "body_es": e.body_es,
                "body_en": e.body_en,
            })
        })
        .collect::<Vec<_>>())
}
