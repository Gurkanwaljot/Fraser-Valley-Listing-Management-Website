import React, { useEffect, useState, useRef } from 'react'
import ListingCarousel from './ListingCarousel';
import { useParams, Link } from 'react-router-dom'
import { CSSTransition } from 'react-transition-group'
import { Badge } from '@windmill/react-ui'

const API_BASE = process.env.REACT_APP_API_BASE;

function CollapsibleSection({ title, children, startOpen = true, className = '' }) {
  const [open, setOpen] = useState(startOpen);
  const sectionId = `${title}`.toLowerCase().replace(/\s+/g, '-') + '-content';

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={sectionId}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full
                     bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title={open ? 'Collapse' : 'Expand'}
        >
          <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>
      </div>

      <div
        id={sectionId}
        className={`px-6 pb-6 transition-all duration-300 ease-in-out
          ${open ? 'opacity-100 max-h-[4000px] mt-0' : 'opacity-0 max-h-0 overflow-hidden p-0 !pb-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = useParams()
  const nodeRef = useRef(null);
  const [agentsInfo, setAgentsInfo] = useState(null)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)
  const [filesList, setImageList] = useState([]);
  const [filesDocId, setFilesDocId] = useState(null);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE}/api/listings/${id}`)
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
        const data = await response.json()
        setListing(data)

        // Fetch Multiple Agents if present
        if(Array.isArray(data.agentIds) && data.agentIds.length){
          const ids = data.agentIds.join(',');
          const agentsRes =  await fetch(`${API_BASE}/api/agents?ids=${ids}`);
          if(agentsRes.ok){
            const agentsData = await agentsRes.json()
            const allFileIds = agentsData.flatMap(a => Array.isArray(a.fileId) ? a.fileId : []).filter(Boolean);
            let filesDocs = [];
            if (allFileIds.length) {
              const uniq = Array.from(new Set(allFileIds));
              const fileAgentRes = await fetch(`${API_BASE}/api/files?ids=${uniq.join(',')}`);
              if (fileAgentRes.ok) {
                filesDocs = await fileAgentRes.json(); // array of { _id, files: [...] }
              }
            }

            // Map file doc id -> files[]
            const filesByDocId = new Map(
              (filesDocs || []).map(doc => [String(doc._id), Array.isArray(doc.agentImages) ? doc.agentImages : []])
            );

            // attach images to each agent
            const merged = agentsData.map(a => {
              const images = (Array.isArray(a.fileId) ? a.fileId : [])
                .flatMap(fid => filesByDocId.get(String(fid)) || []);
              return { ...a, images }; // images: [{url, altText, ...}]
            });
            setAgentsInfo(merged)
          }
        }

        // Listing files
        if(Array.isArray(data.fileId) && data.fileId.length){
          const fileid = data.fileId.join(',');
          const fileRes = await fetch(`${API_BASE}/api/files?ids=${fileid}`);
          if(fileRes.ok){
            const filesData = await fileRes.json();
            // Expecting shape: { _id, listingFiles: [ { listingimagesAndVideos, videos, floorplans, listingDocuments, agentFiles } ] }
            const doc = filesData[0];
            const block = doc?.listingFiles?.[0] || {};
            setImageList(block);
            setFilesDocId(doc?._id || null);
          }
        }

        setShow(true)
      } catch (err) {
        console.error('Failed to fetch listing:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchListing();
  }, [id])

  if (loading) return <p>Loading listing...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!listing) return <p className="text-red-600">Listing not found.</p>

  const { title, address, description, price, cubicasaInfo } = listing
  const specs = listing.specs
  const status = listing.status

  // inside Detail.js after you’ve fetched listing
const slug = listing.slug || (listing.address || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0,80) || `listing-${String(listing._id).slice(-6)}`;

  function getInitials(name = '') {
    const parts = name.trim().split(' ').filter(Boolean);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }
  const getBadgeType = (status) => {
    switch (status) {
      case 'draft':
        return 'warning'
      case 'delivered':
        return 'purple' // you already applied a custom purple badge
      case 'archived':
        return 'neutral'
      default:
        return 'primary'
    }
  }

  return (
    <CSSTransition
      in={show}
      timeout={1000}
      classNames="slide"
      nodeRef={nodeRef}
      unmountOnExit
    >
      <div ref={nodeRef} className="transition-wrapper space-y-8">
        {/* Header: Back button + title + status */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/app/listings" title="Back to Listings">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer">
                <i className="fas fa-arrow-left text-white text-xl"></i>
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{address}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-4">
            <Link to={`/listings/${id}/preview`}  title="Preview Listing">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer">
                  <i className="fas fa-eye text-white text-sm"></i>
                </div>
            </Link>
            <Link to={`/app/listings/${id}/edit`} title="Edit Listing">
               <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer">
                <i className="fas fa-edit text-white text-sm"></i>
              </div>
            </Link>
            <Badge type={getBadgeType(status)} className="text-base px-4 py-2 rounded-full">
              {status}
            </Badge>
          </div>
        </div>

        {/* Carousel (now tabbed) */}
        <CollapsibleSection title="Listing Files" startOpen={false} className="mt-0">
        <div>
          <ListingCarousel files={filesList} fileDocId={filesDocId} listingId={id} />
        </div>
        </CollapsibleSection>
        <CollapsibleSection title="Cubicasa Listing" startOpen={false} className="mt-0">
          {/* Cubicasa for Listing */}
          {cubicasaInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" id="cubicasaDiv">
              <div
                dangerouslySetInnerHTML={{ __html: cubicasaInfo.html }}
              />
            </div>
          )}
        </CollapsibleSection>
       <CollapsibleSection title="Description" startOpen={false} className="mt-0">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-2">
              ${price.toLocaleString()}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{description}</p>
          </div>
         </CollapsibleSection>
         <CollapsibleSection title="Specifications" startOpen={false} className="mt-0">
            {/* Specifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-gray-700 dark:text-gray-300 text-sm">
                <div><strong>Beds:</strong> {specs.beds}</div>
                <div><strong>Baths:</strong> {specs.baths}</div>
                <div><strong>Garage:</strong> {specs.garage}</div>
                <div><strong>Year Built:</strong> {specs.yearBuilt}</div>
                <div><strong>Living Area:</strong> {specs.livingAreaSqFt} sq ft</div>
                <div><strong>Lot Size:</strong> {specs.lotSizeSqFt || '—'} sq ft</div>
                <div><strong>Type:</strong> {specs.propertyType}</div>
                <div><strong>Tax:</strong> ${specs.propertyTax}</div>
                <div><strong>Tax Year:</strong> {specs.taxYear}</div>
              </div>
            </div>
         </CollapsibleSection>
        {/* Agent Information */}
        {Array.isArray(agentsInfo) && agentsInfo.length > 0 && (
          <CollapsibleSection title="Agent Information" startOpen={false} className="mt-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-0 py-2 overflow-hidden">
                <div className="px-6 pb-6 space-y-6">
                  {agentsInfo.map((agent) => {
                    const agentPhoto = agent.images?.find(img => img.altText === 'agent-photo')?.url;
                    const brokerageLogo = agent.images?.find(img => img.altText === 'brokerage-logo')?.url;

                    return (
                      <div
                        key={agent._id}
                        className="grid grid-cols-1 md:grid-cols-3 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Left: agent photo */}
                        <div className="bg-gray-50 dark:bg-gray-900 w-32 h-40 md:h-16" id="agent-photo">
                          {agentPhoto ? (
                            <img
                              src={agentPhoto}
                              alt={agent.name ? `${agent.name} headshot` : 'Agent photo'}
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-56 md:h-full flex items-center justify-center">
                              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-2xl font-semibold shadow">
                                {getInitials(agent?.name)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: info + small brokerage logo (per-card) */}
                        <div className="md:col-span-2 p-4 md:p-6">
                          <div className="flex items-start justify-between">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-gray-700 dark:text-gray-300">
                              <div>
                                <span className="block text-base font-semibold text-gray-500 dark:text-gray-400">Name</span>
                                <span className="text-lg font-medium">{agent?.name || '—'}</span>
                              </div>
                              <div>
                                <span className="block text-base font-semibold text-gray-500 dark:text-gray-400">Email</span>
                                {agent?.email ? (
                                  <a href={`mailto:${agent.email}`} className="text-lg font-medium hover:underline">
                                    {agent.email}
                                  </a>
                                ) : (
                                  <span className="text-lg font-medium">—</span>
                                )}
                              </div>
                              <div>
                                <span className="block text-base font-semibold text-gray-500 dark:text-gray-400">Phone</span>
                                {agent?.phone ? (
                                  <a href={`tel:${agent.phone}`} className="text-lg font-medium hover:underline">
                                    {agent.phone}
                                  </a>
                                ) : (
                                  <span className="text-lg font-medium">—</span>
                                )}
                              </div>
                              <div>
                                <span className="block text-base font-semibold text-gray-500 dark:text-gray-400">Brokerage</span>
                                <span className="text-lg font-medium">{agent?.brokerage || '—'}</span>
                              </div>
                            </div>

                            {/* small brokerage logo on the right of this card */}
                            {brokerageLogo && (
                              <img
                                src={brokerageLogo}
                                alt={`${agent?.brokerage || 'Brokerage'} logo`}
                                className="ml-4 h-10 w-10 rounded-full object-contain bg-white ring-1 ring-gray-200 dark:ring-gray-700"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </CollapsibleSection>
        )}
      </div>
    </CSSTransition>
  )
}

export default ListingDetail
