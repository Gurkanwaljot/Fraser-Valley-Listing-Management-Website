
import express from 'express'
import path from 'path'
import cors from 'cors'
import cookieParser from 'cookie-parser';  
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import listingsRouter from './routes/listings.js'
import agentsRouter from './routes/agents.js'
import filesRouter from './routes/files.js'
import previewRouter from './routes/preview.js'
import previewViewRouter from './routes/previewView.js'
import authRouter from './routes/auth.js'
import publicViewRouter from './routes/publicView.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5002

const CLIENT_BASE = (process.env.REACT_APP_CLIENT_BASE || '').replace(/\/+$/,'');

const corsOptions = {
  origin: CLIENT_BASE,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-admin-key','Authorization'],
};

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser());             // 👈 add

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
// Ensure /app/uploads exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// API routes
app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/files', filesRouter)
app.use('/api/preview', previewRouter);            // 👈 mount here
app.use('/api/preview', previewViewRouter);  // GET  /api/preview/listings/:id?token=...
app.use('/api/public', publicViewRouter);

// // 3) (Optional) Serve SPA build ONLY if it exists; otherwise return JSON 404
// const BUILD_DIR = path.join(process.cwd(), 'public')  // change if different
// const indexHtml = path.join(BUILD_DIR, 'index.html')

// // Catch-all to serve index.html for React Router
// app.get('/{*any}', (req, res) => {
//   res.sendFile(indexHtml)
// })

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))