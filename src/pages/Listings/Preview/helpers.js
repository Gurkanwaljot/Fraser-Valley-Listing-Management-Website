
/* =========================
   Small helpers
   ========================= */
export const getExt = (u = '') =>
  u?.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';

export const isImageExt = (e = '') =>
  ['jpg','jpeg','png','gif','webp','bmp','svg','tiff','avif'].includes(e);

export const isVideoExt = (e = '') =>
  ['mp4','mov','webm','mkv','avi','m4v'].includes(e);

export const fileIcon = (e) => {
  if (e === 'pdf') return { icon: 'fa-file-pdf',    tone: 'text-red-600',   bg: 'bg-red-50' };
  if (['doc','docx'].includes(e)) return { icon: 'fa-file-word',   tone: 'text-blue-600',  bg: 'bg-blue-50' };
  if (['xls','xlsx','csv'].includes(e)) return { icon: 'fa-file-excel',  tone: 'text-green-600', bg: 'bg-green-50' };
  if (['ppt','pptx'].includes(e)) return { icon: 'fa-file-powerpoint', tone: 'text-orange-600', bg: 'bg-orange-50' };
  if (['zip','rar','7z'].includes(e)) return { icon: 'fa-file-archive', tone: 'text-amber-600', bg: 'bg-amber-50' };
  if (isVideoExt(e)) return { icon: 'fa-file-video',  tone: 'text-purple-600', bg: 'bg-purple-50' };
  return { icon: 'fa-file', tone: 'text-gray-600', bg: 'bg-gray-50' };
};

export const initials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
};

// Detect media type from URL extension
export function inferMediaFromUrl(input) {
  const url = input || "";
  const clean = url.split("?")[0].split("#")[0];
  const ext = (clean.split(".").pop() || "").toLowerCase();

  const IMG_EXT = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"];
  const VID_EXT = ["mp4", "webm", "ogg", "mov", "m4v"];

  if (VID_EXT.includes(ext)) return { type: "video", url };
  return { type: "image", url };
}

// Very light heuristic: try to find an address-like string in the file titles or urls.
// You can make this smarter if your files contain machine-readable JSON or text assets.

export const extractAddressFromFiles = (listingFiles = {}, fallbackAddress = "") => {
  // Prefer exact address on listingFiles (string or nested obj)
  const direct =
    (typeof listingFiles.address === "string" && listingFiles.address) ||
    (listingFiles.address?.full) || // if you store a structured address
    "";

  return (direct || fallbackAddress || "").trim();
}