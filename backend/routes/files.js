import express from 'express'
import File from '../models/File.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'

const router = express.Router();

// ---------- utils ----------
const cwd = process.cwd()
const UPLOADS_DIR = path.join(cwd, 'uploads')

/**
 * Determine where to store files and what the public base URL is.
 * Returns { folderType: 'listing'|'agent', ownerId: string }
 *
 * Priority:
 * 1) Explicit typed routes: /listing/:id/... or /agent/:id/...
 * 2) Body fields: listing or agent (for legacy).
 * 3) Legacy param-only routes default to listing.
 */
function resolveUploadOwner(req) {
  // 1) Typed routes
  if (req.params?.listingId) {
    return { folderType: 'listing', ownerId: String(req.params.listingId) }
  }
  if (req.params?.agentId) {
    return { folderType: 'agent', ownerId: String(req.params.agentId) }
  }
  if (req.params?.type && (req.params.type === 'listing' || req.params.type === 'agent') && req.params?.id) {
    return { folderType: req.params.type, ownerId: String(req.params.id) }
  }

  // 2) Body-driven (multer may call destination before fields are parsed; this is best-effort fallback)
  // NOTE: For robust routing, prefer the typed routes below.
  if (req.body && req.body.listing) {
    return { folderType: 'listing', ownerId: String(req.body.listing) }
  }
  if (req.body && req.body.agent) {
    return { folderType: 'agent', ownerId: String(req.body.agent) }
  }

  // 3) Legacy: /:id/... assumed listing
  if (req.params?.id) {
    return { folderType: 'listing', ownerId: String(req.params.id) }
  }

  return null
}


/**
 * Extract the /uploads relative path from a URL and return an absolute safe path.
 * Allows nested subfolders like listing/<id>/file.jpg or agent/<id>/file.jpg.
 */
function absolutePathFromUploadsUrl(urlish) {
  if (!urlish) return null

  // Normalize: get pathname portion; handle raw paths too
  let pathname = ''
  try {
    const u = new URL(urlish, 'http://local.placeholder')
    pathname = u.pathname // e.g. /uploads/listing/123/file.jpg
  } catch {
    // Not a full URL — treat as raw path like /uploads/...
    pathname = urlish
  }

  // Must start with /uploads/
  if (!pathname.startsWith('/uploads/')) return null
  const rel = pathname.replace(/^\/uploads\//, '') // e.g. listing/123/file.jpg

  // Build absolute and normalize
  const abs = path.join(UPLOADS_DIR, rel)
  const normalized = path.normalize(abs)

  // Guard traversal: ensure still within UPLOADS_DIR
  if (!normalized.startsWith(UPLOADS_DIR)) return null

  return normalized
}

async function tryUnlink(urlish) {
  const abs = absolutePathFromUploadsUrl(urlish)
  if (!abs) return
  try {
     fs.unlinkSync(abs);
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('unlink warning:', err.message)
  }
}

// ---------- multer storage (single instance that resolves per-request) ----------
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { folderType, ownerId } = resolveUploadOwner(req) || {};
    if (!folderType || !ownerId) return cb(new Error('Missing listing/agent identifier'));

    const dir = path.join(process.cwd(), 'uploads', folderType, ownerId);
    fs.mkdirSync(dir, { recursive: true });
    // remember web base for URL building later in this request
    req._uploadWebBase = `/uploads/${folderType}/${ownerId}/`;
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage })


// --------------------------------------
// GET /api/files?ids=..&listing=..&agent=..&q=..
// Returns Image documents (each with files[])
// --------------------------------------
router.get('/', async (req, res) => {
  try {
    const { ids, listing, agent, q } = req.query
    const filter = {}

    if (ids) {
      const idArray = ids.split(',').map(s => s.trim()).filter(Boolean)
      filter._id = { $in: idArray }
    }
    if (listing) filter.listing = listing
    if (agent)   filter.agent   = agent
    if (q)       filter['files.altText'] = { $regex: q, $options: 'i' }

    const docs = await File.find(filter).sort({ createdAt: -1 })
    res.json(docs)
  } catch (err) {
    console.error('GET /files error:', err)
    res.status(500).json({ message: err.message })
  }
})


/**
 * NEW explicit, typed routes (recommended):
 * - POST /api/files/listing/:id/multi
 * - POST /api/files/agent/:id/multi
 * - POST /api/files/listing/:id (single)
 * - POST /api/files/agent/:id (single)
 */
router.post('/listing/:id/multi/', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded. Use field name "images".' })
    }
    const listing = req.params.id
    if (!listing) {
      return res.status(400).json({ message: 'Provide listing or agent' })
    }
    const fileId = req.body.fileId;
    const altArr = Array.isArray(req.body.altText)
      ? req.body.altText
      : (typeof req.body.altText === 'string' ? [req.body.altText] : [])

    const base = `${req.protocol}://${req.get('host')}${req._uploadWebBase}`
    const items = req.files.map((f, i) => ({ url: `${base}${f.filename}`, altText: altArr[i] || '' }))

    // Group by altText (upload type)
    const grouped = items.reduce((acc, file) => {
      const type = file.altText?.trim();
      if (!type) return acc; // skip if no type
      if (!acc[type]) acc[type] = [];
      acc[type].push(file);
      return acc;
    }, {});

    if (!Object.keys(grouped).length) {
      return res.status(400).json({ message: 'Each file must have altText indicating its type.' });
    }
    // 1) Build one $push document for all types
    const pushOps = {};
    for (const [uploadType, files] of Object.entries(grouped)) {
      // files is your array: [{ url, altText, ... }, ...]
      pushOps[`listingFiles.0.${uploadType}`] = { $each: files };
    }
     // ---------- Resolve target doc (listing is always present) ----------
    // If fileId provided, require it to match the same listing.
    // Else, upsert by listing.
    let target;
    if (fileId && mongoose.Types.ObjectId.isValid(fileId)) {
      target = await File.findOne({ _id: fileId, listing }).lean();
      if (!target) {
        // If the provided fileId doesn't belong to this listing, fail fast to prevent cross-updates.
        return res.status(404).json({ message: 'fileId not found for the provided listing.' });
      }
    } else {
      target = await File.findOne({ listing }).lean();
      if (!target) {
        // Create a fresh, normalized doc for this listing
        target = await File.create({ listing, listingFiles: [{}] });
      }
    }
    // ---------- Normalize shape if needed (prevents "conflict at 'files'") ----------
    const needsRepair =
      !Array.isArray(target.files) ||
      target.files.length === 0 ||
      typeof target.files[0] !== 'object' ||
      target.files[0] === null;

    if (needsRepair) {
      await File.updateOne({ _id: target._id }, { $set: { listingFiles: [{}] } });
    }
    // 3) Push everything into the single container
    const doc = await File.findOneAndUpdate(
      { _id: target._id, listing },   // always include listing in the filter
      { $push: pushOps },
      { new: true }
    );
    res.status(201).json(doc)
  } catch (err) {
    console.error(`POST /files/listing/:id/multi error:`, err)
    res.status(500).json({ message: err.message })
  }
})

router.post('/agent/:id/multi', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' })
    const agent = req.params.id;
    const altArr = Array.isArray(req.body.altText) ? req.body.altText
                  : (typeof req.body.altText === 'string' ? [req.body.altText] : [])
    const base = `${req.protocol}://${req.get('host')}${req._uploadWebBase}`
    const items = req.files.map((f, i) => ({ url: `${base}${f.filename}`, altText: altArr[i] || '' }))

    const doc = await File.findOneAndUpdate(
      { agent },
      { 
        $setOnInsert: { agent: agent ||  undefined }, 
        $push: { agentImages: { $each: items } } 
      },
      { new: true, upsert: true }
    )
    res.status(201).json(doc)
  } catch (err) {
    console.error('POST /files/agent/:id/multi error:', err)
    res.status(500).json({ message: err.message })
  }
})

// --------------------------------------
// POST /api/files/from-url
// body: { url, altText?, listing?, agent? }
// Upserts and pushes URL (no upload)
// --------------------------------------
router.post('/from-url', async (req, res) => {
  try {
    const { url, altText = '', listing, agent } = req.body
    if (!url) return res.status(400).json({ message: 'url is required' })
    if (!listing && !agent) return res.status(400).json({ message: 'Provide listing or agent' })

    const filter = listing ? { listing } : { agent }

    const doc = await File.findOneAndUpdate(
      filter,
      {
        $setOnInsert: { listing: listing || undefined, agent: agent || undefined },
        $push: { listingFiles: { url, altText } },
      },
      { new: true, upsert: true }
    )

    res.status(201).json(doc)
  } catch (err) {
    console.error('POST /files/from-url error:', err)
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/files/:listingId
// body: { files: [{ url, altText }, ...] }  // final state after user clicks Save
// PUT /api/files/:listingId
// body.files = [{ url, altText }, ...]   // final state
router.put('/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const incoming = req.body?.listingFiles || req.body;
    // 0) Load previous to compute removals
    const prev = await File.findOne({ listing: listingId }).lean();
    const flattenUrls = (obj) =>
      Object.values(obj || {}).flat().map(i => i?.url).filter(Boolean);

    const prevUrls = new Set(prev?.files?.[0] ? flattenUrls(prev.listingFiles[0]) : []);
    const nextUrls = new Set(flattenUrls(incoming));
    const removed  = [...prevUrls].filter(u => !nextUrls.has(u));

    // 1) Ensure doc exists and has correct shape (ONE-TIME normalize)
    if (!prev) {
      // create exact final state in one go
      const created = await File.create({ listing: listingId, listingFiles: [incoming] });
      await Promise.all(removed.map(tryUnlink)); // removed will be empty first time
      return res.json(created);
    }

    // If doc exists but files is not an array or files[0] missing, repair once
    const needsRepair = !Array.isArray(prev.listingFiles) ||
                        prev.listingFiles.length === 0 ||
                        typeof prev.listingFiles[0] !== 'object' ||
                        prev.listingFiles[0] === null;

    if (needsRepair) {
      await File.updateOne({ _id: prev._id }, { $set: { listingFiles: [{}] } });
    }

    // 2) Replace the container with the final state (NO $push)
    const updated = await File.findOneAndUpdate(
      { listing: listingId },
      { $set: { 'listingFiles.0': incoming } },
      { new: true }
    );

    // 3) Best-effort unlink removed local files
    await Promise.all(removed.map(tryUnlink));

    return res.json(updated);
  } catch (err) {
    console.error('PUT /files/:listingId error:', err);
    return res.status(400).json({ message: err.message });
  }
});
// PUT /api/files/:listingId/selected
router.put('/:listingId/selected', async (req, res) => {
  try {
    const { listingId } = req.params;
    const incoming =  req.body;

    if (!Array.isArray(incoming)) {
      return res.status(400).json({ message: 'selectedOnly array is required' });
    }

    const doc = await File.findOne({ listing: listingId });
    if (!doc) return res.status(404).json({ message: 'File doc not found' });

    const key = (u = '', a = '') => `${u}__${a}`.toLowerCase();
    const incomingMap = new Map(
      incoming.map(({ url = '', altText = '', selected = false }) => [
        key(url, altText),
        !!selected,
      ])
    );

    const block = doc.listingFiles?.[0] || {};
    const updateArray = (arr) =>
      Array.isArray(arr)
        ? arr.map(item => {
            const u = item?.url || '';
            const a = item?.altText || '';
            const k = key(u, a);
            // if present in payload, use provided boolean; otherwise set to false
            const nextSelected = incomingMap.has(k) ? incomingMap.get(k) : false;
            return { ...item, selected: nextSelected };
          })
        : arr;

    const nextBlock = {
      ...block,
      listingimagesAndVideos: updateArray(block.listingimagesAndVideos),
      videos: updateArray(block.videos),
      floorplans: updateArray(block.floorplans),
      listingDocuments: updateArray(block.listingDocuments),
      agentFiles: updateArray(block.agentFiles),
    };

    if (!Array.isArray(doc.listingFiles) || doc.listingFiles.length === 0) {
      doc.listingFiles = [nextBlock];
    } else {
      doc.listingFiles[0] = nextBlock;
    }

    const saved = await doc.save();
    return res.json(saved);
  } catch (err) {
    console.error('PUT /files/:listingId/selected error:', err);
    return res.status(500).json({ message: err.message });
  }
});


// --------------------------------------
// DELETE /api/files/:listingId
// body: { urls: ['http://.../uploads/a.png', ...] }
// Pull those URLs from images[] and unlink files
// --------------------------------------
router.delete('/:listingId', async (req, res) => {
  try {
    const  id  = req.params.listingId;
       const doc = await File.findOneAndUpdate(
      { listing: id },
      { $set: { listingFiles: [] } },
      { new: true, upsert: true }
    );
    if (!doc) return res.status(404).json({ message: 'ImageSet not found for listing' })
    res.json({ message: 'Images removed', listingFiles: doc.files })
    // fetch current doc to get URLs to unlink
    const docImages = await File.findOne({ listing: id });
    if (!docImages) return res.status(404).json({ message: 'ImageSet not found for listing' });

    // best-effort remove local files
    await Promise.all((docImages.files || []).map(file => tryUnlink(file.url)));
  } catch (err) {
    console.error('DELETE /files/:listingId error:', err)
    res.status(400).json({ message: err.message })
  }
})

// Replace (or set) a single agent image by altText.
// Form-data: image (file), altText (e.g. "agent-photo" | "agent-logo" | "brokerage-logo")
// requires MongoDB 4.2+ (pipeline updates) and Mongoose 5.13+/6+
router.post('/agent/:id/replace', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded. Use field "image".' });

    const agent = req.params.id;
    const altText = (req.body.altText || '').trim();
    if (!altText) return res.status(400).json({ message: 'altText is required' });

    // Build new public URL (this is a URL, not a filesystem path)
    const base = `${req.protocol}://${req.get('host')}${req._uploadWebBase || '/uploads/'}`;
    const newUrl = `${base}${req.file.filename}`;

    // Single atomic update:
    //  - Ensure agentImages exists
    //  - Filter out any item with same altText
    //  - Append the new item
    const updated = await File.findOneAndUpdate(
      { agent },
      [
        { $set: { agentImages: { $ifNull: ['$agentImages', []] } } },
        { $set: {
            agentImages: {
              $concatArrays: [
                {
                  $filter: {
                    input: '$agentImages',
                    as: 'img',
                    cond: { $ne: ['$$img.altText', altText] }
                  }
                },
                [ { url: newUrl, altText } ]
              ]
            }
        } }
      ],
      { new: true, upsert: true }
    );
    // OPTIONAL: If you want to unlink the previous file, fetch the prior URL *before* the update
    // (You can move a findOne() before and diff, or return the "previous" from the pipeline with $let)
    return res.status(200).json(updated);
  } catch (err) {
    console.error('POST /files/agent/:id/replace error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// start here unlinking files is not working
// DELETE /api/files/agent/:id/by-alt/:altText
router.delete('/agent/:id/by-alt/:altText', async (req, res) => {
    try{
        const agent = req.params.id;
        const altText = req.params.altText;

        const doc = await File.findOne({agent});
        if (!doc) return res.status(404).json({ message: 'ImageSet not found for agent' });

        const imagesArr = Array.isArray(doc.agentImages) ? doc.agentImages: [];
        const toRemove = imagesArr.filter(i => i.altText === altText);

        if(toRemove.length === 0) return res.json({ message: 'Nothing to remove', removed: 0, files: doc.agentImages });

        // pull matching entries
        await File.updateOne(
            {agent},
            { $pull: {agentImages: {altText}}}
        )
        // remove the files related to that entry
        await Promise.all(
            toRemove.map(i => i?.url ? tryUnlink(i.url) : Promise.resolve())
        );
        const updated = await File.findOne({ agent });
        return res.json({ message: 'Removed', removed: toRemove.length, agentImages: updated.files || [] });
    } catch (err) {
        console.error('DELETE /files/agent/:id/by-alt/:altText error:', err);
        res.status(500).json({ message: err.message });
    }
})

export default router