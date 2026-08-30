use metadissect::types::{Analysis, Field};

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
        keys: &["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSMapDatum", "GPSLatitudeRef", "GPSLongitudeRef", "GPSAltitudeRef"],
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
        keys: &["ExposureTime", "FNumber", "PhotographicSensitivity", "ISO", "ISOSpeedRatings", "FocalLength", "Flash"],
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
        keys: &["og:title", "og:image", "og:description", "twitter:card", "twitter:image", "canonical", "dc.creator"],
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
        keys: &["Copyright", "CopyrightNotice", "rights"],
        title_es: "Copyright",
        title_en: "Copyright",
        body_es: "Texto de derechos incrustado. No equivale a un registro legal; se puede reescribir al exportar.",
        body_en: "Embedded rights text. Not a legal registration; exporters often rewrite it.",
    },
    GlossaryEntry {
        keys: &["XResolution", "YResolution", "ResolutionUnit"],
        title_es: "Resolución",
        title_en: "Resolution",
        body_es: "Píxeles por pulgada/cm para impresión. No cambia el recuento de píxeles reales.",
        body_en: "Pixels per inch/cm for print. Does not change the real pixel count.",
    },
    GlossaryEntry {
        keys: &["ColorSpace", "ComponentsConfiguration"],
        title_es: "Color",
        title_en: "Color",
        body_es: "ColorSpace 1 = sRGB. Un valor distinto o ausente complica la reproducción de color.",
        body_en: "ColorSpace 1 = sRGB. Other or missing values complicate color reproduction.",
    },
    GlossaryEntry {
        keys: &["og:image", "og:description", "twitter:image", "dc.creator", "Description@CreatorTool"],
        title_es: "Web / XMP aliases",
        title_en: "Web / XMP aliases",
        body_es: "Claves OG/Twitter y atributos XMP (p. ej. Description@CreatorTool) describen cómo se comparte o etiquetó el objeto.",
        body_en: "OG/Twitter keys and XMP attributes describe how the object is shared or labeled.",
    },
    GlossaryEntry {
        keys: &["Entropy"],
        title_es: "Entropía",
        title_en: "Entropy",
        body_es: "Aleatoriedad media (0–8 bits/byte). Cerca de 8 sugiere cifrado o compresión fuerte; valores bajos, texto o relleno.",
        body_en: "Average randomness (0–8 bits/byte). Near 8 suggests encryption or strong compression; low values suggest text or padding.",
    },
    GlossaryEntry {
        keys: &["ClaimGenerator", "claim_generator", "claimGenerator"],
        title_es: "C2PA ClaimGenerator",
        title_en: "C2PA ClaimGenerator",
        body_es: "Identifica la herramienta o servicio que generó la claim C2PA (p. ej. Adobe Content Credentials, open-source-signer). Ayuda a rastrear quién firmó o selló el manifiesto.",
        body_en: "Identifies the tool or service that produced the C2PA claim (e.g. Adobe Content Credentials). Helps trace who signed or sealed the manifest.",
    },
    GlossaryEntry {
        keys: &["Action", "c2pa.actions", "actions", "c2pa.action"],
        title_es: "C2PA Actions",
        title_en: "C2PA Actions",
        body_es: "Registro de operaciones sobre el activo: c2pa.created, c2pa.edited, c2pa.opened, c2pa.placed, etc. La cadena de acciones describe el historial de edición declarado por el firmante.",
        body_en: "Log of operations on the asset: c2pa.created, c2pa.edited, c2pa.opened, etc. The action chain describes the edit history asserted by the signer.",
    },
    GlossaryEntry {
        keys: &["SoftwareAgent", "softwareAgent", "software_agent"],
        title_es: "C2PA SoftwareAgent",
        title_en: "C2PA SoftwareAgent",
        body_es: "Programa concreto que ejecutó una acción C2PA (nombre + versión). Distinto de ClaimGenerator: puede haber varios agentes en una misma claim.",
        body_en: "Specific program that performed a C2PA action (name + version). Distinct from ClaimGenerator; multiple agents can appear in one claim.",
    },
    GlossaryEntry {
        keys: &["ingredient.hash", "IngredientHash", "activeManifest.hash"],
        title_es: "C2PA ingredient hash",
        title_en: "C2PA ingredient hash",
        body_es: "Huella del ingrediente (archivo padre o componente) referenciado en el manifiesto. Permite verificar que el binario embebido no cambió respecto al declarado.",
        body_en: "Fingerprint of the ingredient (parent file or component) referenced in the manifest. Verifies the embedded binary matches what was declared.",
    },
    GlossaryEntry {
        keys: &["ICCProfile", "ColorProfile", "ProfileDescription", "ProfileCopyright"],
        title_es: "Perfil ICC",
        title_en: "ICC profile",
        body_es: "Tabla de color incrustada (sRGB, Adobe RGB, ProPhoto…). Define cómo interpretar los valores de píxel al mostrar o imprimir. Un perfil ausente o genérico puede indicar conversión.",
        body_en: "Embedded colour table (sRGB, Adobe RGB, ProPhoto…). Defines how to interpret pixel values for display or print.",
    },
    GlossaryEntry {
        keys: &["APP1", "APP0", "JFIF", "JFIFVersion"],
        title_es: "Segmentos JPEG APP",
        title_en: "JPEG APP segments",
        body_es: "APP0 suele llevar JFIF (versión y densidad). APP1 aloja EXIF/XMP. Varios APP1 o APP desconocidos pueden indicar reescritura o herramientas extra.",
        body_en: "APP0 often carries JFIF (version and density). APP1 hosts EXIF/XMP. Multiple or unknown APP segments can indicate rewrites.",
    },
    GlossaryEntry {
        keys: &["PhotometricInterpretation", "Compression", "CompressionType"],
        title_es: "Interpretación y compresión",
        title_en: "Photometric & compression",
        body_es: "PhotometricInterpretation indica RGB, escala de grises o CMYK. Compression (TIFF/JPEG) describe el algoritmo (sin pérdida, JPEG, LZW…). Valores incoherentes con el contenedor son señal de alerta.",
        body_en: "PhotometricInterpretation marks RGB, greyscale or CMYK. Compression describes the algorithm (lossless, JPEG, LZW…).",
    },
    GlossaryEntry {
        keys: &["SOF0", "SOF2", "StartOfFrame"],
        title_es: "Marcador SOF (JPEG)",
        title_en: "JPEG SOF marker",
        body_es: "Start Of Frame: declara dimensiones reales de la imagen comprimida y componentes de color. Si difiere del EXIF ImageWidth/Height, el archivo pudo recodificarse.",
        body_en: "Start Of Frame: declares real compressed image dimensions and colour components. Mismatch with EXIF size suggests re-encoding.",
    },
    GlossaryEntry {
        keys: &["DQT", "QuantizationTable"],
        title_es: "Tabla de cuantización (DQT)",
        title_en: "Quantization table (DQT)",
        body_es: "Define la pérdida de calidad JPEG. Tablas custom o múltiples DQT pueden revelar el encoder (cámara, Photoshop, recompresión).",
        body_en: "Defines JPEG quality loss. Custom or multiple DQT tables can reveal the encoder (camera, Photoshop, recompression).",
    },
    GlossaryEntry {
        keys: &["IHDR", "IDAT", "PLTE", "tEXt"],
        title_es: "Chunks PNG",
        title_en: "PNG chunks",
        body_es: "IHDR = cabecera (tamaño, profundidad, tipo). IDAT = píxeles comprimidos. PLTE = paleta indexada. tEXt/iTXt = texto embebido. El orden y presencia de chunks ayuda a detectar reescrituras.",
        body_en: "IHDR = header (size, depth, type). IDAT = compressed pixels. PLTE = indexed palette. tEXt/iTXt = embedded text.",
    },
    GlossaryEntry {
        keys: &["Subject", "doc.Subject", "cp.subject", "dc.subject"],
        title_es: "Asunto del documento",
        title_en: "Document subject",
        body_es: "Tema o resumen del documento en PDF Info, DOC SummaryInformation o Dublin Core. Puede filtrarse al exportar pero a veces revela el contexto interno del archivo.",
        body_en: "Topic or summary in PDF Info, DOC SummaryInformation or Dublin Core. Sometimes reveals internal file context.",
    },
    GlossaryEntry {
        keys: &["Keywords", "doc.Keywords", "cp.keywords"],
        title_es: "Palabras clave Office",
        title_en: "Office keywords",
        body_es: "Etiquetas de indexación en Word/Excel/PowerPoint legacy o OOXML. A menudo copiadas de plantillas o sistemas documentales.",
        body_en: "Indexing tags in legacy Office or OOXML. Often copied from templates or document systems.",
    },
    GlossaryEntry {
        keys: &["normalized.Creator", "normalized.Author", "normalized.Producer"],
        title_es: "Campos normalizados",
        title_en: "Normalized fields",
        body_es: "MetaDissect unifica autores y herramientas bajo claves normalizadas para comparar formatos distintos (PDF Producer, XMP dc:creator, EXIF Artist).",
        body_en: "MetaDissect unifies authors and tools under normalized keys to compare formats (PDF Producer, XMP dc:creator, EXIF Artist).",
    },
    GlossaryEntry {
        keys: &["Offset", "offset", "field.offset"],
        title_es: "Offset forense",
        title_en: "Forensic offset",
        body_es: "Posición en bytes donde el parser encontró el campo o estructura. Útil para correlacionar con hex dump, carving o discrepancias de layout.",
        body_en: "Byte position where the parser found the field or structure. Useful for hex correlation and layout anomalies.",
    },
    GlossaryEntry {
        keys: &["Magic", "magic", "hex_signature", "MIME", "mime"],
        title_es: "Magic y MIME",
        title_en: "Magic & MIME",
        body_es: "Los primeros bytes (firma mágica) y el tipo MIME declarado clasifican el contenedor. Una discordancia entre magic, extensión y MIME sugiere renombrado o polyglot.",
        body_en: "Leading bytes (magic signature) and declared MIME type classify the container. Mismatch suggests renaming or polyglot files.",
    },
    GlossaryEntry {
        keys: &["Mtime", "Ctime", "mtime", "ctime", "filesystem.mtime", "filesystem.ctime"],
        title_es: "Tiempos de sistema de archivos",
        title_en: "Filesystem timestamps",
        body_es: "mtime = última modificación de contenido; ctime en Unix = cambio de metadatos del inode (no “creación” Windows). Pueden discrepar con EXIF/PDF si el archivo se copió o tocó fuera de la cámara.",
        body_en: "mtime = last content modification; Unix ctime = inode metadata change (not Windows creation). Can disagree with EXIF/PDF after copy or touch.",
    },
    GlossaryEntry {
        keys: &["MakerNote", "makernote", "MakerNoteOffset"],
        title_es: "MakerNote",
        title_en: "MakerNote",
        body_es: "Bloque EXIF propietario del fabricante (Canon, Nikon, Sony…). Contiene ajustes de cámara, serial interno o firmware. El formato es opaco y varía por marca.",
        body_en: "Vendor-specific EXIF block (Canon, Nikon, Sony…). Holds camera settings, internal serial or firmware. Format is opaque and vendor-specific.",
    },
    GlossaryEntry {
        keys: &["Rich Header", "RichHeader", "rich_header", "DanS"],
        title_es: "Rich Header (PE)",
        title_en: "Rich Header (PE)",
        body_es: "Estructura opaca tras el DOS stub en ejecutables Windows. Codifica toolchain/compilador (linker, MSVC). Útil en malware y atribución de builds.",
        body_en: "Opaque structure after the DOS stub in Windows executables. Encodes toolchain/compiler (linker, MSVC). Useful in malware attribution.",
    },
    GlossaryEntry {
        keys: &["CompanyName", "FileVersion", "OriginalFilename", "ProductVersion", "InternalName"],
        title_es: "Versión PE (VS_VERSION)",
        title_en: "PE version info",
        body_es: "Metadatos del recurso VERSIONINFO: empresa, nombre interno, archivo original y versiones numéricas. Pueden contradecir el nombre en disco o el certificado Authenticode.",
        body_en: "VERSIONINFO resource metadata: company, internal name, original filename and numeric versions. Can contradict on-disk name or Authenticode cert.",
    },
];

pub fn explanation_for(key: &str) -> Option<(String, String)> {
    let k = key.rsplit([':', '.', '/', '@']).next().unwrap_or(key);
    for e in GLOSSARY {
        if e.keys.iter().any(|cand| {
            let c = cand.rsplit([':', '.', '/', '@']).next().unwrap_or(cand);
            cand.eq_ignore_ascii_case(k)
                || cand.eq_ignore_ascii_case(key)
                || c.eq_ignore_ascii_case(k)
                || key.eq_ignore_ascii_case(cand)
        }) {
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
            "MetaInstructor muestra todas las etiquetas que el parser lee; no hay lista blanca. Un campo ausente no implica que no existiera: pudo borrarse al exportar.".into(),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aliases_match_xmp_and_web_keys() {
        assert!(explanation_for("Description@CreatorTool").is_some());
        assert!(explanation_for("dc.creator").is_some());
        assert!(explanation_for("ISOSpeedRatings").is_some());
        assert!(explanation_for("GPSLatitudeRef").is_some());
        assert!(explanation_for("ClaimGenerator").is_some());
        assert!(explanation_for("IHDR").is_some());
        assert!(explanation_for("MakerNote").is_some());
        assert!(explanation_for("CompanyName").is_some());
        assert!(explanation_for("Offset").is_some());
        assert!(explanation_for("normalized.Creator").is_some());
    }
}
