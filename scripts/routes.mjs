export const basePath = '/hoarc/';
export const siteOrigin = 'https://d-bergman.github.io';
export function pageRoute(file) {
  return file === 'index.html' ? '' : file.replace(/\.html$/, '');
}
export function publicUrl(file) { return (siteOrigin + basePath + pageRoute(file)).replace(/\/$/, ''); }
export function sourceForRoute(route) {
  return !route || route === '/' ? 'index.html' : route.replace(/\/$/, '') + '.html';
}
