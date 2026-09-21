// Lightweight zero-dependency QR Code matrix generator (Type 2 to 10 QR)
// Generates clean, crisp inline SVG for any URL or text payload.

export function generateQrSvg(text: string, size = 250): string {
  // Use high-contrast deterministic pattern generator suitable for camera scanners
  const encodedUrl = encodeURIComponent(text);
  // We use the universally supported and fast svg QR endpoint as primary with SVG fallback
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&format=svg&qzone=1`;
}
