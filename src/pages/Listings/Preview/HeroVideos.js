import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

const VIDEO_EXTENSIONS = new Set(["mp4","webm","ogg","ogv","mov","m4v","m3u8"]);
const getExtension = (url="") => {
  const clean = url.split("#")[0].split("?")[0];
  const last = clean.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : "";
};
const isVideoUrl = (url) => VIDEO_EXTENSIONS.has(getExtension(url));

export default function HeroVideos({ media, loop = true, className = "" }) {
  const videos = useMemo(
    () => (Array.isArray(media) ? media.filter(m => m && m.url && isVideoUrl(m.url)) : []),
    [media]
  );

  const total = videos.length;
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, total);
    setIndex(0);
  }, [total]);

  const pauseAll = useCallback(() => {
    videoRefs.current.forEach(el => { try { el && el.pause(); } catch {} });
  }, []);

  const playCurrent = useCallback(() => {
    const el = videoRefs.current[index];
    if (!el) return;
    try {
      el.muted = true; // allow autoplay
      const p = el.play();
      if (p?.then) p.catch(() => {});
    } catch {}
  }, [index]);

  const go = useCallback((dir) => {
    if (!total) return;
    pauseAll();
    setIndex(i => (i + dir + total) % total);
  }, [pauseAll, total]);

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  // Autoplay on slide change
  useEffect(() => {
    if (!total) return;
    const t = setTimeout(playCurrent, 10);
    return () => clearTimeout(t);
  }, [index, total, playCurrent]);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  useEffect(() => pauseAll, [pauseAll]);

  if (!total) return null;

  // Track width is N*100%; translate by index * (100/N)%
  const trackStyle = {
    width: `${total * 100}%`,
    transform: `translateX(-${(index / total) * 100}%)`,
  };
  const slideStyle = { width: `${100 / total}%` };

  return (
    <section className={`relative max-w-6xl mx-auto px-4 ${className}`}>
      <h3 className="sr-only">Video Carousel</h3>

      <div
        className="relative overflow-hidden rounded-xl bg-black"
        onMouseEnter={() => { setIsHovered(true); playCurrent(); }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Track */}
        <div className="flex transition-transform duration-300 ease-out" style={trackStyle}>
          {videos.map((v, i) => (
            <div key={i} className="flex-none" style={slideStyle}>
              <div className="w-full aspect-video bg-black">
                <video
                  controls
                  ref={(el) => (videoRefs.current[i] = el)}
                  src={v.url}
                  poster={v.poster}
                  playsInline
                  muted
                  loop={loop}
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  onMouseEnter={(e) => {
                    try { e.currentTarget.muted = true; e.currentTarget.play().catch(() => {}); } catch {}
                  }}
                />
              </div>
              <div className="mt-2 text-center text-xs md:text-sm text-white/80">
                {v.alt || `Video ${i + 1} of ${total}`}
              </div>
            </div>
          ))}
        </div>

        {/* Left arrow */}
        {total > 1 && (
          <button
            type="button"
            aria-label="Previous video"
            onClick={prev}
            className="lightbox-btn prev"
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {total > 1 && (
          <button
            type="button"
            aria-label="Next video"
            onClick={next}
            className="lightbox-btn next"
          >
            ›
          </button>
        )}

        {/* Indicator */}
        <div className="absolute bottom-2 left-0 right-0">
          <div className="mx-auto max-w-md">
            <div className="mx-2 md:mx-0 bg-black/60 text-white text-xs md:text-sm text-center rounded-sm py-1">
              Video {index + 1}/{total} {isHovered ? "• playing" : ""}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
