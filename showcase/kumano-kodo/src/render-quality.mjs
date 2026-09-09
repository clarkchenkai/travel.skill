// Preserve the existing mobile budget; let desktop render sharply up to a 4K-sized buffer.
export function renderPixelRatio(width, height, deviceRatio = 1, viewportWidth = width) {
  const w = Math.max(1, Number(width) || 1), h = Math.max(1, Number(height) || 1);
  const dpr = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
  return Math.min(dpr, viewportWidth >= 900 ? 2 : 1.5, Math.sqrt((3840 * 2160) / (w * h)));
}
