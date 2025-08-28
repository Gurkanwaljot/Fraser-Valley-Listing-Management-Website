import React, { useCallback, useEffect, useRef, useMemo, useState } from "react";

export default function PhotoVideoGallery({ media, visibleCount = 9 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  // Only keep items that have a URL and are NOT videos
  const items = Array.isArray(media)
    ? media.filter((m) => m && m.url && m.type !== "video")
    : [];
  const total = items.length;

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = total > visible.length;

  const openAt = useCallback((i) => {
    setIndex(i);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  // Lock background scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, prev, next, close]);

  // Touch swipe (simple)
  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches?.[0]?.clientX - touchStartX.current;
    const threshold = 40;
    if (delta > threshold) prev();
    if (delta < -threshold) next();
    touchStartX.current = null;
  };

  if (!total) return null;

  return (
    <section className="max-w-5xl mx-auto px-4">
      <h3 className="sr-only">Photo Gallery</h3>

      {/* 3 × 3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {visible.map((m, i) => {
          const isLastTileWithMore = hasMore && i === visible.length - 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="relative group rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <img
                src={m.url}
                alt={m.alt || `Image ${i + 1}`}
                className="w-full h-64 md:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />

              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm" />

              {isLastTileWithMore && (
                <span className="absolute inset-0 bg-black/40 grid place-content-center text-white text-sm md:text-base tracking-wide">
                  SEE ALL {total} PHOTOS
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/85">
          {/* click outside to close */}
          <div className="absolute inset-0" onClick={close} />

          {/* Centered stage with side gutters */}
          <div className="relative h-full mx-auto px-0 md:px-10">
            {/* media container */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={items[index].url}
                alt={items[index].alt || `Image ${index + 1} of {total}`}
                className="lightbox-media lightbox-img"
              />
            </div>

            {/* left chevron */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous"
              className="lightbox-btn prev"
            >
              {"<"}
            </button>

            {/* right chevron */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next"
              className="lightbox-btn next"
            >
              {">"}
            </button>

            {/* close */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label="Close"
              className="lightbox-btn close"
            >
              X
            </button>

            {/* bottom caption bar */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="mx-auto max-w-6xl">
                <div className="mx-2 md:mx-0 mb-3">
                  <div className="mx-auto w-full bg-black/60 text-white text-xs md:text-sm text-center rounded-sm py-1">
                    Image {index + 1}/{total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}