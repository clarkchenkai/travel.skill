// Finite local assets: unknown sources keep their original URL.
export const photoVariants = {
  'assets/day-wakaura-bay.webp': {originalWidth:1536, hd:'assets/day-wakaura-bay-hd.webp', width:2560},
  'assets/day-tea-path.webp': {originalWidth:1536, hd:'assets/day-tea-path-hd.webp', width:2560},
  'assets/nachi-vertical.webp': {originalWidth:1122, hd:'assets/nachi-vertical-hd.webp', width:2560},
  'assets/day-tokyo-arrival.webp': {originalWidth:1536, hd:'assets/day-tokyo-arrival-hd.webp', width:2560},
  'assets/day-tokyo-street.webp': {originalWidth:1536, hd:'assets/day-tokyo-street-hd.webp', width:2560},
  'assets/day-tokyo-asakusa.webp': {originalWidth:1536, hd:'assets/day-tokyo-asakusa-hd.webp', width:2560},
  'assets/day-kawayu-water.webp': {originalWidth:1536, hd:'assets/day-kawayu-water-hd.webp', width:2560},
  'assets/route-overview-ai.png': {originalWidth:1024, hd:'assets/route-overview-ai-hd.webp', width:1920},
};
const variant = src => photoVariants[String(src).split(/[?#]/)[0]];
export function photoSrcset(src) {
  const item=variant(src);
  return item ? `${src} ${item.originalWidth}w, ${item.hd} ${item.width}w` : undefined;
}
export function scenePhotoSource(src, desktop) {
  return desktop ? variant(src)?.hd || src : src;
}
