import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";

export default function Toolbar({ listing = {}, agentsInfo = [], listingFiles = {} }) {
  const cubicasaInfo   = listing?.cubicasaInfo || {};
  const hasCubicasa    = !!cubicasaInfo.html;
  const hasAbout       = !!listing?.description;
  const hasKeyDetails  = true;
  const hasLocation    = !!listing?.address;
  const hasAgents      = Array.isArray(agentsInfo) && agentsInfo.length > 0;
  const hasFloorPlans  = !!listingFiles?.floorplans?.length;
  const hasDocuments   = !!listingFiles?.listingDocuments?.length;
  const hasGallery     = true;
  const hasVideos      = true;

  const navItems = useMemo(() => ([
    hasGallery    && { id: "gallery",      label: "Gallery" },
    hasVideos     && { id: "videos",       label: "Videos" },
    hasCubicasa   && { id: "cubicasa",     label: "Cubicasa" },
    hasAbout      && { id: "about",        label: "About" },
    hasKeyDetails && { id: "specs",        label: "Key details" },
    hasLocation   && { id: "location",     label: "Location" },
    hasAgents     && { id: "agents",       label: "Agents" },
    hasFloorPlans && { id: "floor-plans",  label: "Floor plans" },
    hasDocuments  && { id: "documents",    label: "Documents" },
  ].filter(Boolean)), [hasGallery, hasVideos, hasCubicasa, hasAbout, hasKeyDetails, hasLocation, hasAgents, hasFloorPlans, hasDocuments]);

  const handleNavClick = useCallback((targetId) => (e) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false); // close mobile menu after navigation
  }, []);

  // ---- Mobile menu state & a11y helpers ----
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click / ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setMobileOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    // (optional) lock scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <nav aria-label="Section navigation" className="toolbar">
      {/* ===== Mobile: hamburger + popover ===== */}
      <div className="toolbar-mobile">
        <button
          type="button"
          className={`toolbar-burger ${mobileOpen ? "is-open" : ""}`}
          aria-label="Open sections menu"
          aria-expanded={mobileOpen}
          aria-controls="toolbar-mobile-panel"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="tb-line" />
          <span className="tb-line" />
          <span className="tb-line" />
        </button>

        {/* Overlay (click to close) */}
        {mobileOpen && <div className="toolbar-overlay" />}

        <div
          id="toolbar-mobile-panel"
          ref={wrapRef}
          className={`toolbar-popover ${mobileOpen ? "is-open" : ""}`}
          role="menu"
        >
          <ul className="toolbar-menu">
            {navItems.map((item) => (
              <li key={item.id} className="toolbar-menu-item">
                <a
                  href={`#${item.id}`}
                  role="menuitem"
                  onClick={handleNavClick(item.id)}
                  className="toolbar-menu-link"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ===== Desktop: existing pill row ===== */}
      <div className="toolbar-shell">
        <div className="toolbar-inner">
          <ul className="toolbar-list">
            {navItems.map((item) => (
              <li key={item.id} className="toolbar-item">
                <a
                  href={`#${item.id}`}
                  onClick={handleNavClick(item.id)}
                  className="toolbar-link"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}