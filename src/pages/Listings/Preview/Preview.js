import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Toolbar from "./Toolbar";
import HeroCarousel from "./HeroCarousel";
import FilesGrid from "./FilesGrid";
import AgentCard from "./AgentCard";
import Gallery from "./Gallery";
import HeroVideos from "./HeroVideos";
import VerfiedLocationSection from "./VerifiedLocationSection";
import { getExt, isImageExt, isVideoExt, inferMediaFromUrl } from "./helpers";

const API_BASE = process.env.REACT_APP_API_BASE;

// ----- helpers -----
function useToken() {
  const { search, hash } = useLocation();
  return useMemo(() => {
    let qs = search;
    if (!qs && hash) {
      const i = hash.indexOf("?");
      if (i !== -1) qs = hash.substring(i);
      if (!qs && hash.startsWith("#t=")) return decodeURIComponent(hash.slice(3));
    }
    const p = new URLSearchParams(qs);
    return p.get("t") || p.get("token") || "";
  }, [search, hash]);
}

async function probeAdmin(apiBase, signal) {
  const res = await fetch(`${apiBase}/api/auth/me`, {
    credentials: "include",
    signal,
  });
  return res.ok;
}

function Preview(props) {
  const { slug, id } = useParams();
  const token = useToken();
  const hasToken = !!token;
  const allowAdmin = props.allowAdmin ?? false;

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [listing, setListing] = useState(null);
  const [agentsInfo, setAgentsInfo] = useState([]);
  const [listingFiles, setListingFiles] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onContext = (e) => {
      // OPTIONAL: allow right-click on specific elements by marking them:
      // if (e.target.closest('[data-allow-context]')) return;
      e.preventDefault();
    };

    document.addEventListener('contextmenu', onContext, { capture: true });
    return () => {
      document.removeEventListener('contextmenu', onContext, { capture: true });
    };
  }, []);

  // --- admin probe (runs once; or when headers change in dev) ---
  useEffect(() => {
   if (!allowAdmin) {
     // skip probing; force non-admin
     setIsAdmin(false);
     setAdminChecked(true);
     return;
   }
   let mounted = true;
   const ac = new AbortController();
   (async () => {
     try {
       const r = await fetch(`${API_BASE}/api/auth/me`, {
         credentials: 'include',
         signal: ac.signal,
       });
       if (mounted) setIsAdmin(r.ok);
     } finally {
       if (mounted) setAdminChecked(true);
     }
   })();
   return () => { mounted = false; ac.abort(); };
 }, [allowAdmin]);

  // --- main data fetch (after adminChecked) ---
  useEffect(() => {
    if (!adminChecked) return;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (allowAdmin && isAdmin) {
          // Admin can load by :id (when coming from Detail) or by :slug direct
          const url = id
            ? `${API_BASE}/api/listings/${id}`
            : `${API_BASE}/api/listings/by-slug/${encodeURIComponent(slug)}`;
          res = await fetch(url, {
            credentials: "include",
            signal: ac.signal,
          });
        } else if (hasToken) {
          // Agent: tokenized preview; if token fails, fall back to public
          const previewUrl = `${API_BASE}/api/preview/slug/${encodeURIComponent(
            slug
          )}?t=${encodeURIComponent(token)}`;
          res = await fetch(previewUrl, { signal: ac.signal });
          if (res.status === 401 || res.status === 403) {
            const publicUrl = `${API_BASE}/api/public/slug/${encodeURIComponent(slug)}`;
            res = await fetch(publicUrl, { signal: ac.signal });
          }
        } else {
          // Public: published listing by slug
          const url = `${API_BASE}/api/public/slug/${encodeURIComponent(slug)}`;
          res = await fetch(url, { signal: ac.signal });
        }

        if (!res || !res.ok) {
          throw new Error(`Error ${res?.status ?? "-"}: ${res?.statusText ?? "Failed to load"}`);
        }

        const listingData = await res.json();
        setListing(listingData);
        // Agents
        if (Array.isArray(listingData.agentIds) && listingData.agentIds.length) {
          const agentIds = listingData.agentIds.join(",");
          const agentRes = await fetch(`${API_BASE}/api/agents?ids=${agentIds}`, { signal: ac.signal });
          if (!agentRes.ok) throw new Error(`Error ${agentRes.status}: ${agentRes.statusText}`);
          const agentsData = await agentRes.json();

          // agent images via Files
          const fileIds = agentsData
            .flatMap((a) => (Array.isArray(a.fileId) ? a.fileId : []))
            .filter(Boolean);
          if (fileIds.length) {
            const uniq = Array.from(new Set(fileIds));
            const agentImgRes = await fetch(`${API_BASE}/api/files?ids=${uniq.join(",")}`, {
              signal: ac.signal,
            });
            if (!agentImgRes.ok)
              throw new Error(`Error ${agentImgRes.status}: ${agentImgRes.statusText}`);
            const agentImgs = await agentImgRes.json();
            const map = new Map(
              (agentImgs || []).map((img) => [
                String(img._id),
                Array.isArray(img.agentImages) ? img.agentImages : [],
              ])
            );
            setAgentsInfo(
              agentsData.map((a) => {
                const images = (Array.isArray(a.fileId) ? a.fileId : []).flatMap(
                  (fid) => map.get(String(fid)) || []
                );
                return { ...a, images };
              })
            );
          } else {
            setAgentsInfo(agentsData);
          }
        } else {
          setAgentsInfo([]);
        }

        // Listing files (images/videos/floorplans/docs)
        if (Array.isArray(listingData.fileId) && listingData.fileId.length) {
          const fileIds = listingData.fileId.join(",");
          const fileRes = await fetch(`${API_BASE}/api/files?ids=${fileIds}`, { signal: ac.signal });
          if (!fileRes.ok) throw new Error(`Error ${fileRes.status}: ${fileRes.statusText}`);
          const filesData = await fileRes.json();
          setListingFiles(filesData[0]?.listingFiles?.[0] || null);
        } else {
          setListingFiles(null);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch listing:", err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [adminChecked, isAdmin, token, slug, id, allowAdmin]);

  // ----- media separation -----
  const heroImages = useMemo(() => {
    if (!listingFiles) return [];
    return (listingFiles.listingimagesAndVideos || [])
      .filter((f) => f.selected)
      .filter((f) => isImageExt(getExt(f.url)))
      .map((f) => ({ ...f, type: "image" }));
  }, [listingFiles]);

  const normalizeMedia = (m) => {
    if (typeof m === "string") return inferMediaFromUrl(m);
    if (!m?.type && m?.url) return inferMediaFromUrl(m.url);
    return m || null;
  };

  const galleryImages = useMemo(() => {
    if (!listingFiles) return [];
    const allMedia = [
      ...(listingFiles.listingimagesAndVideos || []),
    ];
    return allMedia.map(normalizeMedia).filter(Boolean).filter((m) => isImageExt(getExt(m.url)));
  }, [listingFiles]);

  const floorplansImages = useMemo(() => {
    if (!listingFiles) return [];
    const allMedia = [
      ...(listingFiles.floorplans || []),
    ];
    return allMedia.map(normalizeMedia).filter(Boolean).filter((m) => isImageExt(getExt(m.url)));
  }, [listingFiles])

  const videoMedia = useMemo(() => {
    if (!listingFiles) return [];
    return (listingFiles.listingimagesAndVideos || [])
      .filter((f) => isVideoExt(getExt(f.url)))
      .map((f) => ({ ...f }));
  }, [listingFiles]);

  // ----- UI -----
  if (loading)
    return (
      <div className="min-h-screen grid place-content-center text-gray-600">
        Loading…
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen grid place-content-center text-center px-6">
        <p className="text-red-600 font-semibold mb-2">Oops</p>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  if (!listing)
    return (
      <div className="min-h-screen grid place-content-center text-red-600">
        Listing not found.
      </div>
    );

  const specs = listing.specs || {};
  const price = Number(listing.price || 0);
  const cubicasaInfo = listing.cubicasaInfo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 preview--no-context" onContextMenu={(e) => e.preventDefault()}>
      {/* Top bar — admin-only controls */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <>
          {adminChecked && isAdmin && allowAdmin ? (
            <Link
              to={`/app/listings/${id || listing._id}`}
              className="text-purple-700 dark:text-purple-400 hover:underline"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer">
                <i className="fas fa-arrow-left text-white text-xl" />
              </div>
            </Link>
          ) : null}
            <Toolbar listing={listing} agentsInfo={agentsInfo} listingFiles={listingFiles} mode="admin" />
          </>
       
      </div>

      {/* Hero - IMAGES ONLY */}
      <HeroCarousel media={heroImages} title={listing.address} price={price}/>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 space-y-8 mt-8">
        {/* Gallery - IMAGES ONLY */}
        <div className="max-w-6xl mx-auto px-4" id="gallery">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Gallery
          </h3>
          <Gallery media={galleryImages} />
        </div>

        {/* Videos - VIDEOS ONLY */}
        {videoMedia.length > 0 && (
          <div className="max-w-6xl mx-auto px-4" id="videos">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Videos
            </h3>
            <HeroVideos media={videoMedia} />
          </div>
        )}

        {/* Cubicasa for Listing */}
        {cubicasaInfo?.html && (
          <div className="max-w-6xl mx-auto px-4" id="cubicasa">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" id="cubicasaDiv">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                Cubicasa
              </h3>
              <div dangerouslySetInnerHTML={{ __html: cubicasaInfo.html }} />
            </div>
          </div>
        )}

        {/* Description + Specs + Files */}
        <div className="max-w-6xl mx-auto space-y-8">
          {listing.description && (
            <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6" id="about">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                About this home
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {listing.description}
              </p>
            </section>
          )}

          <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6" id="specs">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Key details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8 text-gray-700 dark:text-gray-300 text-base">
              <div><strong>Beds:</strong> {specs.beds ?? "—"}</div>
              <div><strong>Baths:</strong> {specs.baths ?? "—"}</div>
              <div><strong>Garage:</strong> {specs.garage ?? "—"}</div>
              <div><strong>Year Built:</strong> {specs.yearBuilt ?? "—"}</div>
              <div><strong>Living Area:</strong> {specs.livingAreaSqFt ?? specs.livingArea ?? "—"} sq ft</div>
              <div><strong>Lot Size:</strong> {specs.lotSizeSqFt ?? specs.lotSize ?? "—"} sq ft</div>
              <div><strong>Type:</strong> {specs.propertyType ?? "—"}</div>
              <div><strong>Tax:</strong> {specs.propertyTax ? `$${specs.propertyTax}` : "—"}</div>
              <div><strong>Tax Year:</strong> {specs.taxYear ?? "—"}</div>
            </div>
          </section>

          {listingFiles && (
            <>
              {Array.isArray(listingFiles.floorplans) && listingFiles.floorplans.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 text-center max-w-6xl mx-auto" id="gallery">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                      Floor Plans
                    </h3>
                    <Gallery media={floorplansImages} />
                </div>
              )}

              {Array.isArray(listingFiles.listingDocuments) && listingFiles.listingDocuments.length > 0 && (
                <section id="documents">
                  <FilesGrid title="Documents" items={listingFiles.listingDocuments} />
                </section>
              )}

              {Array.isArray(listingFiles.agentFiles) && listingFiles.agentFiles.length > 0 && (
                <FilesGrid title="Downloads" items={listingFiles.agentFiles} />
              )}
            </>
          )}
        </div>

        {listing.address && (
          <section id="location">
            <VerfiedLocationSection listingFiles={listing} fallbackAddress={listing?.address} />
          </section>
        )}

        {Array.isArray(agentsInfo) && agentsInfo.length > 0 && (
          <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6" id="agents">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Agents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {agentsInfo.map((a) => (
                <AgentCard key={a._id} agent={a} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Preview;
