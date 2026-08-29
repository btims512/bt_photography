/**
 * Shared low-res placeholder shown by next/image while a photo's real
 * bytes are still loading, so scrolling to a not-yet-loaded photo reveals
 * a neutral tone matching the page background instead of a blank hole
 * that then pops in once the fetch finishes.
 */
const shimmer = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><rect width="24" height="16" fill="#F4F4F5"/></svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmer)}`;
