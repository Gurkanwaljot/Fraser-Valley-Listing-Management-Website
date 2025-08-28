import React, { useState, useEffect } from 'react'
import { useHistory, Link } from 'react-router-dom'
import PageTitle from '../../components/Typography/PageTitle'
import { Label, Input, Textarea, Select, Button } from '@windmill/react-ui'
import ReactSelect from 'react-select'

const API_BASE = process.env.REACT_APP_API_BASE

export default function CreateListing() {
  const history = useHistory()

  const [form, setForm] = useState({
    title: '',
    address: '',
    description: '',
    price: '',
    agentIds: [],
    fileId: [],
    specs: {
      beds: '',
      baths: '',
      garage: '',
      yearBuilt: '',
      livingArea: '',
      lotSize: '',
      propertyType: 'Detached',
      propertyTax: '',
      taxYear: ''
    },
    cubicasaInfo: {
      htmlText: ''
    }
  })

  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [agentsList, setAgentsList] = useState([])
 
  // set listing photos
  const [listingPhotosAndVideos, setListingPhotosAndVideos] = useState([]);
  const [listingFloorPlans, setListingFloorPlans] = useState([]);
  const [listingDocuments, setListingDocuments] = useState([]);

 // Cubicasa states
  const [cubicasaHtmlRaw, setCubicasaHtmlRaw] = useState('')   // what user types/pastes
  const [cubicasaHtmlSafe, setCubicasaHtmlSafe] = useState('') // sanitized single <iframe> (no title yet)
  const [cubicasaValid, setCubicasaValid] = useState(false)     // true only if textarea is a single iframe
  const [cubicasaTitle, setCubicasaTitle] = useState('')        // title input (enabled only when valid)
  const [iframeError, setIframeError] = useState('')

  // Load agents for dropdown
  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch(`${API_BASE}/api/agents`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        setAgentsList(data)
      } catch (err) {
        console.error('Failed to load agents:', err)
      }
    }
    loadAgents()
  }, [])

  const agentOptions = agentsList.map((agent) => ({ value: agent._id, label: agent.name }))

  const isImage = (file) =>   file && file.type?.startsWith('image/');
  const getExt = (name='') => name.split('.').pop()?.toLowerCase() || '';

  const FILE_KIND = {
  pdf:  { label: 'PDF',  bg: 'bg-red-100',    fg: 'text-red-700'    },
  doc:  { label: 'DOC',  bg: 'bg-blue-100',   fg: 'text-blue-700'   },
  docx: { label: 'DOCX', bg: 'bg-blue-100',   fg: 'text-blue-700'   },
  xls:  { label: 'XLS',  bg: 'bg-green-100',  fg: 'text-green-700'  },
  xlsx: { label: 'XLSX', bg: 'bg-green-100',  fg: 'text-green-700'  },
  csv:  { label: 'CSV',  bg: 'bg-emerald-100',fg: 'text-emerald-700'},
  txt:  { label: 'TXT',  bg: 'bg-gray-100',   fg: 'text-gray-700'   },
  zip:  { label: 'ZIP',  bg: 'bg-gray-100',  fg: 'text-gray-700'  },
  rar:  { label: 'RAR',  bg: 'bg-gray-100',  fg: 'text-gray-700'  },
  ppt:  { label: 'PPT',  bg: 'bg-orange-100', fg: 'text-orange-700' },
  pptx: { label: 'PPTX', bg: 'bg-orange-100', fg: 'text-orange-700' },
  default: { label: 'FILE', bg: 'bg-gray-100', fg: 'text-gray-700' }
};
  const FileThumb = ({ item, onRemove }) => {
    const file = item;
    const name = item?.name || 'file';
    const ext =  getExt(name);
    console.log(file)
    if (isImage(file)) {
    // image preview tile
      return (
        
        <div className="relative">
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
            title="Remove"
          >
            ×
          </button>
          <div className="w-40 h-40 overflow-hidden rounded-lg shadow">
            <img
              src={URL.createObjectURL(file)}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="mt-1 w-40 text-xs text-center truncate">{name}</p>
        </div>
      );
    }
    // non-image icone title
    const kind = FILE_KIND[ext] || FILE_KIND.default;
    return (
      <div className="relative">
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
            title="Remove">
            ×
          </button>
          <div id="nonImageThumbnail" className={`"w-40 h-40 flex items-center justify-center  ${kind.bg} rounded-lg shadow`}>
            {/* Simple File Icon */}
            <div className="flex flex-col items-center">
              <svg width="48" height="48" viewBox="0 0 24 24" className={kind.fg}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" opacity=".15"/>
                <path d="M14 2v6h6M8 13h8M8 17h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className={`mt-2 text-xs font-semibold ${kind.fg}`}>{kind.label}</span>
              <p className="mt-1 block w-full truncate text-xs text-center" title={name}> {name}</p>
            </div>
          </div>
      </div>
    )
  }
  // --- IFRAME sanitization/verification ---
  // Returns { valid, html, reason } where html is a single sanitized <iframe> WITHOUT title injected yet.
  const verifySingleIframe = (html) => {
    try {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = html || ''

      const iframe = wrapper.querySelector('iframe')
      if (!iframe) return { valid: false, html: '', reason: 'No <iframe> tag found.' }

      // ensure there is only that iframe (ignore whitespace/comments)
      const onlyIframe =
        Array.from(wrapper.childNodes).every((n) =>
          n.nodeType === 8 ||
          (n.nodeType === 3 && !n.textContent.trim()) ||
          (n.nodeType === 1 && n === iframe)
        )
      if (!onlyIframe) return { valid: false, html: '', reason: 'Only a single <iframe> is allowed.' }

      // remove any inline event handlers
      Array.from(iframe.attributes).forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) iframe.removeAttribute(attr.name)
      })

      // Do NOT set title here (we set it later when the title field is valid)
      // Optional: normalize width/height if you want
      return { valid: true, html: iframe.outerHTML, reason: '' }
    } catch {
      return { valid: false, html: '', reason: 'Invalid HTML.' }
    }
  }
  // Basic (top-level) fields handler
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Nested specs handler
  const handleSpecsChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [name]: value } }))
  }

  // Agents multi-select handler
  const handleAgentSelect = (selected) => {
    const ids = selected ? selected.map((opt) => opt.value) : []
    setForm((prev) => ({ ...prev, agentIds: ids }))
  }


  // Listing Photos and Videos Selection
  const handleListingPhotosAndVideosChanges = (e) => {
    const files = Array.from(e.target.files || []);
    console.log("files: ", files)
    setListingPhotosAndVideos((prev) => [...prev, ...files]);
  }
  // Listing Floor Plans Selection
  const handleListingFloorPlansChange = (e) => {
    const files = Array.from(e.target.files || []);
    setListingFloorPlans((prev) => [...prev, ...files]);
  }
  // Listing Documents Selection
  const handleListingDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setListingDocuments((prev) => [...prev, ...files]);
  }
  
  // Remove Photos and Videos related to listing
  const handleRemovePhotosAndVideos = (index) => {
    setListingPhotosAndVideos((prev) => prev.filter((_, i) => i !== index))
  }
  // Remove Floor Plans related to listing
  const handleRemoveFloorPlans= (index) => {
    setListingFloorPlans((prev) => prev.filter((_, i) => i !== index))
  }
  // Remove Documents related to listing
  const handleRemoveDocuments= (index) => {
    setListingDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  // IFrame textarea first
  const onCubicasaHtmlChange = (e) => {
    const raw = e.target.value;
    setCubicasaHtmlRaw(raw);
    const {valid, html, reason} = verifySingleIframe(raw);
    setCubicasaValid(valid);
    setIframeError(valid ? '' : reason);
    setCubicasaHtmlSafe(valid ? html: '');
    // If it becomes invalid also disable/reset title
    if(!valid) setCubicasaTitle('');
  }
  // Title input (enabled only when iframe is valid)
  const onCubicasaTitleChange = (e) => {
    setCubicasaTitle(e.target.value)
  }
  console.log("listingPhotosAndVideos: ",listingPhotosAndVideos)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Build Cubicasa block
      let cubicasaBlock = { html: ''}

      if(cubicasaHtmlRaw.trim()){
        // Must be a valid single frame first
        const check = verifySingleIframe(cubicasaHtmlRaw);
        if(!check.valid){
          setIframeError(check.reason || 'Invalid iframe');
          throw new Error('Cubicasa iframe is invalid.');
        }
        const safeTitle = (cubicasaTitle || '').trim();
        if(!safeTitle){
          setIframeError('Please provide a title for the iframe.')
          throw new Error('Cubicasa title is required.')
        }

        // Inject title into the sanitized iframe
        const div = document.createElement('div');
        div.innerHTML = check.html;
        const iframe = div.querySelector('iframe');
        iframe.setAttribute('title', safeTitle);
        cubicasaBlock = {html : iframe.outerHTML};
        console.log("cubicasa block: ", cubicasaBlock);
      }
      // 1) Create the listing WITHOUT images first
      const listingPayload = {
        title: form.title,
        address: form.address,
        description: form.description,
        price: Number(form.price),
        agentIds: form.agentIds,
        fileId: form.fileId,
        specs: {
          beds: Number(form.specs.beds),
          baths: Number(form.specs.baths),
          garage: Number(form.specs.garage),
          yearBuilt: Number(form.specs.yearBuilt),
          livingArea: Number(form.specs.livingArea),
          lotSize: Number(form.specs.lotSize),
          propertyType: form.specs.propertyType,
          propertyTax: Number(form.specs.propertyTax),
          taxYear: Number(form.specs.taxYear),
        },
        cubicasaInfo: cubicasaBlock
      }
      
      const createRes = await fetch(`${API_BASE}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingPayload),
      })
    
      const created = await createRes.json()
      if (!createRes.ok) throw new Error(created.message || 'Failed to create listing')

      const listingId = created._id
      // If Listing Photos and videos are uploaded, then send request to updates listing photos 
      if(listingPhotosAndVideos.length || listingFloorPlans.length || listingDocuments.length){
        const fd = new FormData()
        // NOTE: field name must be "images" to match the backend router
        listingPhotosAndVideos.forEach((file) => {
          fd.append('images', file)
          fd.append('altText', 'listingimagesAndVideos');
        })
        listingFloorPlans.forEach((file) => {
          fd.append('images', file)
          fd.append('altText', 'floorplans');
        })
        listingDocuments.forEach((file) => {
          fd.append('images', file)
          fd.append('altText', 'listingDocuments');
        })
        fd.append('field', '')
        const listingImgsRes =  await fetch(`${API_BASE}/api/files/listing/${listingId}/multi`, {
          method: 'POST',
          body: fd,
        })
        const listingFilesDoc = await listingImgsRes.json();
        console.log(listingFilesDoc);
        // If Listing.fileId is a SINGLE ref (recommended)z:
        const doc = await fetch(`${API_BASE}/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: listingFilesDoc._id }),
        })
        const data = await doc.json();
        console.log(data);
      }

      // Success → go back to listings grid
      history.push('/app/listings')
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/app/listings" title="Back to Listings">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer">
            <i className="fas fa-arrow-left text-white text-xl"></i>
          </div>
        </Link>
        <PageTitle>Create Listing</PageTitle>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Label>
            <span>Title</span>
            <Input
              name="title"
              type="text"
              className="mt-1"
              value={form.title}
              onChange={handleChange}
              required
            />
          </Label>

          <Label>
            <span>Address</span>
            <Input
              name="address"
              type="text"
              className="mt-1"
              value={form.address}
              onChange={handleChange}
              required
            />
          </Label>

          <Label className="md:col-span-2">
            <span>Description</span>
            <Textarea
              name="description"
              className="mt-1"
              value={form.description}
              onChange={handleChange}
              required
            />
          </Label>

          <Label>
            <span>Price</span>
            <Input
              name="price"
              type="number"
              className="mt-1"
              value={form.price}
              onChange={handleChange}
              required
            />
          </Label>

          <Label>
            <span>Agents</span>
            <ReactSelect
              isMulti
              options={agentOptions}
              className="mt-1"
              classNamePrefix="react-select"
              onChange={handleAgentSelect}
              placeholder="Select agents..."
            />
          </Label>
        </div>

        {/* Specifications */}
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['beds', 'baths', 'garage', 'yearBuilt', 'livingArea', 'lotSize', 'propertyTax', 'taxYear'].map((field) => (
            <Label key={field}>
              <span>
                {field === 'livingArea'
                  ? 'Living Area (SqFt)'
                  : field === 'lotSize'
                    ? 'Lot Size (SqFt)'
                    : field === 'yearBuilt'
                      ? 'Year Built'
                      : field.charAt(0).toUpperCase() + field.slice(1)}
              </span>
              <Input
                name={field}
                type="number"
                className="mt-1"
                value={form.specs[field] || ''}   
                onChange={handleSpecsChange}       
                required
              />
            </Label>
          ))}

          <Label>
            <span>Property Type</span>
            <Select
              name="propertyType"
              className="mt-1"
              value={form.specs.propertyType}
              onChange={handleSpecsChange}
            >
              <option>Detached</option>
              <option>Townhome</option>
              <option>Condo</option>
            </Select>
          </Label>
        </div>

 {/* Cubicasa FIRST: iframe textarea, then title (disabled until valid) */}
        <div>
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">Cubicasa for Listing</h2>

          <Label className="mt-2">
            <span>Iframe HTML (paste only a single &lt;iframe&gt;)</span>
            <Textarea
              rows="4"
              value={cubicasaHtmlRaw}
              onChange={onCubicasaHtmlChange}
              placeholder={`Example: <iframe src="https://example.com/embed/123" width="100%" height="400" style="border:0;"></iframe>`}
            />
          </Label>

          <Label className="mt-3">
            <span>Iframe Title (enabled once a valid iframe is detected)</span>
            <Input
              type="text"
              value={cubicasaTitle}
              onChange={onCubicasaTitleChange}
              placeholder="e.g., Cubicasa Floor Plan"
              disabled={!cubicasaValid}
            />
          </Label>

          {iframeError && (
            <p className="text-red-600 text-sm mt-2">{iframeError}</p>
          )}

          {/* Live preview: render sanitized iframe (without title) just for layout preview */}
          {cubicasaValid && cubicasaHtmlSafe && (
            <div className="mt-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
              <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 p-2">
                {/* eslint-disable-next-line react/no-danger */}
                <div
                  dangerouslySetInnerHTML={{ __html: cubicasaHtmlSafe }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Image Upload & Preview */}
        <Label>
          <span>Upload Listing Photos</span>
          <Input
            multiple
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleListingPhotosAndVideosChanges}
          />
        </Label>

        {listingPhotosAndVideos.some(i => i?.type?.startsWith('image/')) && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {listingPhotosAndVideos
                .map((item, idx) => ({ item, idx })) // preserve original indices
                .filter(({ item }) => item?.type?.startsWith('image/'))
                .map(({ item, idx }) => (
                  <FileThumb
                    key={`${item.name}-${idx}`}
                    item={item}
                    onRemove={() => handleRemovePhotosAndVideos(idx)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Video Upload & Preview */}
        <Label className="block mt-8">
          <span>Upload Listing Videos</span>
          <Input
            multiple
            type="file"
            accept="video/*"
            className="mt-2"
            onChange={handleListingPhotosAndVideosChanges}
          />
        </Label>

        {listingPhotosAndVideos.some(i => i?.type?.startsWith('video/')) && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {listingPhotosAndVideos
                .map((item, idx) => ({ item, idx })) // preserve original indices
                .filter(({ item }) => item?.type?.startsWith('video/'))
                .map(({ item, idx }) => (
                  <FileThumb
                    key={`${item.name}-${idx}`}
                    item={item}
                    onRemove={() => handleRemovePhotosAndVideos(idx)}
                  />
                ))}
            </div>
          </div>
        )}

        <Label>
          <span>Upload Listing Floor Plans</span>
          <Input
            multiple
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleListingFloorPlansChange}
          />
        </Label>
        {listingFloorPlans.length > 0 && (
           <div className="mt-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {listingFloorPlans.map((item, idx) =>
                      <FileThumb
                        key={`${item.name}-${idx}`}
                        item={item}
                        onRemove={() => handleRemoveFloorPlans(idx)} />
                  )}
                </div>
            </div>
        )}
        <Label>
          <span>Upload Listing Documents</span>
          <Input
            multiple
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
            className="mt-2"
            onChange={handleListingDocumentsChange}
          />
        </Label>
        {listingDocuments.length > 0 && (
           <div className="mt-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {listingDocuments.map((item, idx) =>
                      <FileThumb
                        key={`${item.name}-${idx}`}
                        item={item}
                        onRemove={() => handleRemoveDocuments(idx)} />
                  )}
                </div>
            </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  )
}
