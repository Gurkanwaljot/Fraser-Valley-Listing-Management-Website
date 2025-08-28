import React, { useState, useEffect, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE;

// Temporary image/files carousel (now with SEPARATE Images and Videos tabs)
const ListingCarousel = ({ files, fileDocId, listingId }) => {
  // --- helpers ---
  const ext = (u = "") =>
    u?.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";

  const isImageExt = (e = "") =>
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "avif"].includes(e);

  const isVideoExt = (e = "") =>
    ["mp4", "mov", "webm", "mkv", "avi", "m4v"].includes(e);

  const fname = (u = "") => u?.split("/").pop()?.replace(/\d+-/g, "") || "file";

  const iconFor = (e) =>
    e === "pdf" ? "fa-file-pdf" :
    ["doc", "docx"].includes(e) ? "fa-file-word" :
    ["xls", "xlsx", "csv"].includes(e) ? "fa-file-excel" :
    ["ppt", "pptx"].includes(e) ? "fa-file-powerpoint" :
    ["zip", "rar", "7z"].includes(e) ? "fa-file-archive" :
    isVideoExt(e) ? "fa-file-video" :
    ["txt", "md", "rtf"].includes(e) ? "fa-file-lines" :
    "fa-file";

  // --- normalize incoming shape ---
  const safeArr = (x) => (Array.isArray(x) ? x : []);
  const asUrlAlt = (arr = []) =>
    arr.map((it) => ({
      url: it?.url || "",
      altText: it?.altText || "",
      selected: !!it?.selected,
    }));

  const baseMedia = Array.isArray(files)
    ? asUrlAlt(files)
    : [...asUrlAlt(files?.listingimagesAndVideos), ...asUrlAlt(files?.videos)];

  const initialImages = baseMedia.filter((m) => isImageExt(ext(m.url)));
  const initialVideos = baseMedia.filter((m) => isVideoExt(ext(m.url)));

  const floorList = Array.isArray(files) ? [] : asUrlAlt(files?.floorplans);
  const docsList = Array.isArray(files) ? [] : asUrlAlt(files?.listingDocuments);

  // Tabs: images | videos | floor | docs
  const [activeTab, setActiveTab] = useState("images");

  // Selection workflow now applies to IMAGES tab only
  const [selectionMode, setSelectionMode] = useState(false);
  const [localImages, setLocalImages] = useState(initialImages);
  const [localVideos, setLocalVideos] = useState(initialVideos);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  // Lightbox viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState("image"); // 'image' | 'video'
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerVideoRef = useRef(null); // to auto-play video on open

  // Refresh state when prop changes
  useEffect(() => {
    const nextBase = Array.isArray(files)
      ? asUrlAlt(files)
      : [...asUrlAlt(files?.listingimagesAndVideos), ...asUrlAlt(files?.videos)];
    setLocalImages(nextBase.filter((m) => isImageExt(ext(m.url))));
    setLocalVideos(nextBase.filter((m) => isVideoExt(ext(m.url))));
  }, [files]); // eslint-disable-line

  const counts = {
    images: localImages.length,
    videos: localVideos.length,
    floor: floorList.length,
    docs: docsList.length,
  };

  // Viewer helpers
  const openImageViewerAt = (idx) => {
    setViewerMode("image");
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const openVideoViewerAt = (idx) => {
    setViewerMode("video");
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

  const nextItem = () => {
    const len = viewerMode === "video" ? localVideos.length : localImages.length;
    if (!len) return;
    setViewerIndex((i) => (i + 1) % len);
  };

  const prevItem = () => {
    const len = viewerMode === "video" ? localVideos.length : localImages.length;
    if (!len) return;
    setViewerIndex((i) => (i - 1 + len) % len);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft") prevItem();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerMode, localImages.length, localVideos.length]);

  // Auto-play video when the video lightbox opens or slide changes
  useEffect(() => {
    if (!viewerOpen || viewerMode !== "video") return;
    const el = viewerVideoRef.current;
    if (!el) return;
    try {
      el.muted = true; // allow autoplay in most browsers
      const p = el.play();
      if (p?.then) p.catch(() => {});
    } catch {}
  }, [viewerOpen, viewerMode, viewerIndex]);

  const startSelection = () => {
    setSaveError(null);
    setSaveOk(false);
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSaveError(null);
    setSaveOk(false);
    // revert from incoming props
    const nextBase = Array.isArray(files)
      ? asUrlAlt(files)
      : [...asUrlAlt(files?.listingimagesAndVideos), ...asUrlAlt(files?.videos)];
    setLocalImages(nextBase.filter((m) => isImageExt(ext(m.url))));
    setLocalVideos(nextBase.filter((m) => isVideoExt(ext(m.url))));
  };

  const saveSelection = async () => {
    if (!fileDocId) {
      setSaveError("File document ID missing. Cannot save.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);

    try {
      // include ALL items (images + videos) to preserve current server shape
      const payload = [...localImages, ...localVideos].map(({ url, altText, selected }) => ({
        url,
        altText,
        selected: !!selected,
      }));

      const listingImgsRes = await fetch(`${API_BASE}/api/files/${listingId}/selected`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await listingImgsRes.json();
      setSaveOk(true);
      setSelectionMode(false);
    } catch (err) {
      setSaveError(err.message || "Failed to save selection.");
    } finally {
      setSaving(false);
    }
  };

  // ------- Renderers -------
  const renderImageGrid = (items, { withCheckboxes = false } = {}) => {
    if (!items?.length) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No images found.</p>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((it, i) => {
          const label = fname(it.url);
          const checked = !!it.selected;
          return (
            <div key={`img-${i}`} className="min-w-0 flex flex-col items-center relative">
              <div className="relative w-40 aspect-square overflow-hidden rounded-lg shadow bg-gray-100 dark:bg-gray-800">
                {withCheckboxes && (
                  <label className="absolute top-1 left-1 z-10 bg-white/80 dark:bg-gray-900/70 rounded px-1 py-0.5 text-xs cursor-pointer shadow">
                    <input
                      type="checkbox"
                      className="align-middle"
                      checked={checked}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = { ...next[i], selected: e.target.checked };
                        setLocalImages(next);
                      }}
                    />
                  </label>
                )}

                {!withCheckboxes ? (
                  <button
                    type="button"
                    title={label}
                    onClick={() => openImageViewerAt(i)}
                    className="block w-full h-full focus:outline-none"
                  >
                    <img
                      src={it.url}
                      alt={label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <img
                    src={it.url}
                    alt={label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <p className="mt-2 w-40 truncate text-sm text-center text-gray-600 dark:text-gray-400">
                {label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVideoGrid = (items) => {
    if (!items?.length) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No videos found.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((it, i) => {
          const label = fname(it.url);
          return (
            <div key={`vid-${i}`} className="min-w-0 flex flex-col items-center relative">
              <button
                type="button"
                title={label}
                onClick={() => openVideoViewerAt(i)}
                className="relative w-full aspect-video overflow-hidden rounded-lg shadow bg-black focus:outline-none"
              >
                {/* Thumbnail is the actual video: muted + loop; plays when hovered */}
                <video
                  src={it.url}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover bg-black"
                  onMouseEnter={(e) => {
                    try {
                      e.currentTarget.play().catch(() => {});
                    } catch {}
                  }}
                  onMouseLeave={(e) => {
                    try {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    } catch {}
                  }}
                />
                {/* Play badge */}
                <span className="pointer-events-none absolute inset-0 grid place-content-center">
                  <span className="h-10 w-10 rounded-full bg-black/50 text-white grid place-content-center text-lg">
                    ▶
                  </span>
                </span>
              </button>
              <p className="mt-2 w-full truncate text-sm text-center text-gray-300">
                {label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  // Current item for viewer (based on mode)
  const currentArray = viewerMode === "video" ? localVideos : localImages;
  const currentItem = currentArray[viewerIndex] || {};
  const currentExt = ext(currentItem?.url);
  const isCurrentImage = isImageExt(currentExt);
  const isCurrentVideo = isVideoExt(currentExt);

  // --- UI ---
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("images")}
          className={`px-3 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "images"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          Images{counts.images ? ` (${counts.images})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("videos")}
          className={`px-3 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "videos"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          Videos{counts.videos ? ` (${counts.videos})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("floor")}
          className={`px-3 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "floor"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          Floor Plans{counts.floor ? ` (${counts.floor})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`px-3 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "docs"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          Documents{counts.docs ? ` (${counts.docs})` : ""}
        </button>
      </div>

      {/* IMAGES TAB */}
      {activeTab === "images" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Images</h4>
            {!selectionMode && (
              <button
                type="button"
                onClick={startSelection}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
              >
                Select Carousel
              </button>
            )}
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          {saveOk && <p className="text-sm text-green-600">Selection saved.</p>}

          {renderImageGrid(localImages, { withCheckboxes: selectionMode })}

          {selectionMode && (
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={saveSelection}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelSelection}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIDEOS TAB */}
      {activeTab === "videos" && (
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">Videos</h4>
          {renderVideoGrid(localVideos)}
        </div>
      )}

      {/* FLOOR PLANS */}
      {activeTab === "floor" && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 file-title">Floor Plans</h2>
          {docsList?.length === 0 && !floorList?.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No floor plans found.</p>
          ) : (
            <div className="space-y-2">{/* default open-in-new-tab */}{renderDocsOrPlans(floorList)}</div>
          )}
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === "docs" && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 file-title">Documents</h2>
          {renderDocsOrPlans(docsList)}
        </div>
      )}

      {/* LIGHTBOX VIEWER */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={closeViewer}>
          <div className="relative h-full mx-auto px-0 md:px-10" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button type="button" onClick={closeViewer} className="lightbox-btn close" title="Close (Esc)">
              <i className="fas fa-times"></i>
            </button>

            {/* Prev / Next */}
            {(viewerMode === "image" ? localImages.length : localVideos.length) > 1 && (
              <>
                <button type="button" onClick={prevItem} className="lightbox-btn prev" title="Previous (←)">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button type="button" onClick={nextItem} className="lightbox-btn next" title="Next (→)">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}

            <div className="flex items-center justify-center">
              {viewerMode === "image" && isCurrentImage && (
                <img
                  src={currentItem?.url}
                  alt={currentItem?.altText || fname(currentItem?.url || "")}
                  className="lightbox-media lightbox-img"
                />
              )}

              {viewerMode === "video" && isCurrentVideo && (
                <video
                  ref={viewerVideoRef}
                  src={currentItem?.url}
                  className="max-h-[85vh] w-auto rounded-lg shadow-lg bg-black"
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              )}

              {/* Fallback (shouldn't occur in image/video tabs) */}
              {!isCurrentImage && !isCurrentVideo && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-gray-800 dark:text-gray-100 shadow-lg">
                  <p className="mb-3 font-semibold">Preview not available</p>
                  <a
                    href={currentItem?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <i className={`fas ${iconFor(ext(currentItem?.url || ""))}`}></i>
                    Open file
                  </a>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="mt-3 text-center text-sm text-white/90">
              {currentItem?.altText || fname(currentItem?.url || "")}
              <span className="ml-2 opacity-75">
                ({viewerIndex + 1} / {(viewerMode === "video" ? localVideos : localImages).length})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // helper for floor/docs (unchanged open-in-new-tab)
  function renderDocsOrPlans(items) {
    if (!items?.length) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No items found.</p>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((it, i) => {
          const e = ext(it.url);
          const label = fname(it.url);
          const isImg = isImageExt(e);
          return (
            <div key={`file-${i}`} className="min-w-0 flex flex-col items-center relative">
              <a href={it.url} target="_blank" rel="noopener noreferrer" title={label} className="block w-40">
                <div className="w-40 aspect-square overflow-hidden rounded-lg shadow bg-gray-100 dark:bg-gray-800 grid place-items-center">
                  {isImg ? (
                    <img src={it.url} alt={label} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <i className={`fas ${iconFor(e)} fa-3x text-gray-600 dark:text-gray-300`} />
                  )}
                </div>
              </a>
              <p className="mt-2 w-40 truncate text-sm text-center text-gray-600 dark:text-gray-400">{label}</p>
            </div>
          );
        })}
      </div>
    );
  }
};

export default ListingCarousel;