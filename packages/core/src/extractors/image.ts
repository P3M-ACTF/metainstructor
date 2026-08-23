import exifr from 'exifr';
import type { AnalyzeOptions } from '../types.js';
import { createSection } from '../utils/helpers.js';

export async function extractImage(
  buffer: Buffer | Uint8Array,
  _options: AnalyzeOptions,
): Promise<{ sections: ReturnType<typeof createSection>[]; warnings: string[] }> {
  const warnings: string[] = [];
  const sections: ReturnType<typeof createSection>[] = [];

  try {
    const exif = await exifr.parse(buffer, { tiff: true, xmp: true, iptc: true, gps: true });
    if (exif) {
      const general: Record<string, unknown> = {};
      const camera: Record<string, unknown> = {};
      const gps: Record<string, unknown> = {};

      if (exif.Make) general.make = exif.Make;
      if (exif.Model) general.model = exif.Model;
      if (exif.DateTimeOriginal) general.dateTaken = exif.DateTimeOriginal;
      if (exif.DateTime) general.dateModified = exif.DateTime;
      if (exif.Orientation) general.orientation = exif.Orientation;
      if (exif.ImageWidth) general.width = exif.ImageWidth;
      if (exif.ImageHeight) general.height = exif.ImageHeight;
      if (exif.Software) general.software = exif.Software;

      if (exif.ExposureTime) camera.exposureTime = exif.ExposureTime;
      if (exif.FNumber) camera.fNumber = exif.FNumber;
      if (exif.ISO) camera.iso = exif.ISO;
      if (exif.FocalLength) camera.focalLength = exif.FocalLength;
      if (exif.LensModel) camera.lens = exif.LensModel;

      if (exif.latitude != null) gps.latitude = exif.latitude;
      if (exif.longitude != null) gps.longitude = exif.longitude;
      if (exif.GPSAltitude) gps.altitude = exif.GPSAltitude;

      if (Object.keys(general).length) sections.push(createSection('exif-general', 'EXIF General', general));
      if (Object.keys(camera).length) sections.push(createSection('exif-camera', 'Camera', camera));
      if (Object.keys(gps).length) sections.push(createSection('exif-gps', 'GPS', gps));
    } else {
      warnings.push('No EXIF data found in image');
    }
  } catch (err) {
    warnings.push(`EXIF extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sections, warnings };
}
