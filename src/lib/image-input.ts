export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const LANGUAGES = ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Portuguese", "Italian"];
export const OUTPUT_MODES = ["detailed", "short", "alt", "social"] as const;
export type OutputMode = typeof OUTPUT_MODES[number];
export type ImageOutputs = Record<OutputMode, string>;

export function validateImageFile(file: Pick<File, "type" | "size">): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Choose a JPG, PNG, WebP, or GIF image.";
  if (file.size === 0) return "This file is empty. Choose another image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 10 MB or smaller.";
  return null;
}

export function publicImageUrl(input: string): URL {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  // Fetching happens in the browser, with CORS and no credentials. No server URL proxy.
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") ||
      /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)) {
    throw new Error("Use a public HTTPS image URL, or upload the file.");
  }
  return url;
}

export function csvCell(value: string): string {
  // Spreadsheet applications interpret formula prefixes even inside quoted CSV fields.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}
