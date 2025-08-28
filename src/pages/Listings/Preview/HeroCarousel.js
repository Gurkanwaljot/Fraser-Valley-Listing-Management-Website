import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function HeroGallery({ media = [], title,  price}) {
  const hasMedia = Array.isArray(media) && media.length > 0;
  // Build [lastClone, ...media, firstClone] for seamless loop
  const slides = useMemo(() => {
    if (!hasMedia) return [];
    const first = media[0];
    const last = media[media.length - 1];
    return [last, ...media, first];
  }, [media, hasMedia]);

  const [index, setIndex] = useState(1);           // start at first real slide
  const [enableTx, setEnableTx] = useState(true);  // toggle transition when snapping
  const [isDragging, setDragging] = useState(false);
  const [dragDX, setDragDX] = useState(0);         // px delta while dragging
  const startXRef = useRef(0);
  const trackRef = useRef(null);
  const hoverRef = useRef(false);
  const autoplayRef = useRef(null);

  const slideWPercent = 100; // each slide = 100% width of track
  const durationMs = 700;    // slide duration
  const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)'; // pleasant ease (similar to iOS)

  const next = () => setIndex(i => i + 1);
  const prev = () => setIndex(i => i - 1);

  // autoplay every 2.5s (pause on hover)
  useEffect(() => {
    if (!hasMedia) return;
    autoplayRef.current = setInterval(() => {
      if (!hoverRef.current && !isDragging) next();
    }, 2500);
    return () => clearInterval(autoplayRef.current);
  }, [hasMedia, isDragging]);

  // Snap logic after we hit clones
  const onTxEnd = () => {
    if (!hasMedia) return;
    if (index === slides.length - 1) { // at cloned last (after final real)
      setEnableTx(false);
      setIndex(1); // snap to first real
    } else if (index === 0) {          // at cloned first (before first real)
      setEnableTx(false);
      setIndex(slides.length - 2); // snap to last real
    }
  };

  // Re-enable transition on the next frame after a snap
  useEffect(() => {
    if (!enableTx) {
      const t = requestAnimationFrame(() => setEnableTx(true));
      return () => cancelAnimationFrame(t);
    }
  }, [enableTx]);

  // Reset to first real if media changes
  useEffect(() => {
    if (hasMedia) setIndex(1);
  }, [hasMedia]);

  // --- Drag/Swipe handlers ---
  const startDrag = (clientX) => {
    setDragging(true);
    setDragDX(0);
    startXRef.current = clientX;
    setEnableTx(false); // disable transition while dragging
    clearInterval(autoplayRef.current);
  };
  const moveDrag = (clientX) => {
    if (!isDragging) return;
    setDragDX(clientX - startXRef.current);
  };
  const endDrag = () => {
    if (!isDragging) return;
    setDragging(false);
    const threshold = (trackRef.current?.clientWidth || 0) * 0.1; // 10% swipe
    setEnableTx(true);
    if (dragDX > threshold) {
      prev();
    } else if (dragDX < -threshold) {
      next();
    }
    setDragDX(0);
  };

  // mouse
  const onMouseDown = (e) => startDrag(e.clientX);
  const onMouseMove = (e) => moveDrag(e.clientX);
  const onMouseUp = endDrag;
  const onMouseLeave = () => { if (isDragging) endDrag(); };

  // touch
  const onTouchStart = (e) => startDrag(e.touches[0].clientX);
  const onTouchMove = (e) => moveDrag(e.touches[0].clientX);
  const onTouchEnd = endDrag;

  if (!hasMedia) return null;

  // translate includes drag offset (converted to percentage of container width)
  const containerW = trackRef.current?.clientWidth || 0;
  const dxPercent = containerW ? (dragDX / containerW) * 100 : 0;
  const translate = -(index * slideWPercent) + dxPercent;

  return (
    <section
      className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden mx-auto"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
    {/* Main carousel */}
    <div
      className="relative w-full aspect-16-9 overflow-hidden select-none"
      ref={trackRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
        <div
          className={`flex h-full`}
          style={{
            transform: `translateX(${translate}%)`,
            transition: enableTx ? `transform ${durationMs}ms ${easing}` : 'none',
          }}
          onTransitionEnd={onTxEnd}
        >
          {slides.map((m, i) => (
            <div key={i} className="w-full h-full flex-shrink-0">
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt={m.altText || `Media ${i}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <video className="w-full h-full object-cover" controls playsInline>
                  <source src={m.url} />
                </video>
              )}
            </div>
          ))}
        </div>

        {/* Overlay gradient for readability */}
        {(title || typeof price === 'number') && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-gradient-to-t from-black/50 via-black/10 to-black/50" />
            {/* Centered title/price */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center px-4">
                {title ? (
                  <h1 className="hero-title">
                    {title}
                  </h1>
                ) : null}
                {typeof price === 'number' ? (
                  <p className="hero-price">
                    ${price.toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}