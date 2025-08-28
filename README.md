Fraser Valley Listings — Listing & Agent Management

A full-stack app for creating and managing property listings and agents, curating media, and sharing secure preview links with agents/clients. Built with React, Express, and MongoDB.

✨ Features

Admin Dashboard
Create/edit/delete Listings and Agents
Attach Files to listings (Images & Videos, Floor Plans, Documents, Agent Files)
Context actions (view, send to agent, delete)

Media Curation
Tabbed “Images & Videos / Floor Plans / Documents” view
Selection mode with checkboxes (top-left of tiles)
Persist selected flag (UrlAltSchema.selected = true/false) for preview carousel

Public / Agent Preview
Clean public URL format: https://yourdomain.com/<listing-slug>?t=<jwt>
Email a scoped token link to the agent; no “preview” in the URL
Admin sees full toolbar/back button; agent/public do not
Hero carousel with address/price overlay; Gallery, Videos, Cubicasa embed, Key Details, Location, Agents

Email Sending (SMTP)
“Send to Agent” opens selection modal → sends signed link via email
On successful send, listing status is set to Published

Access Control
Admin: cookie/session (or dev key) unlocks full API + UI controls
Agent: tokenized preview by slug (/:slug?t=...)
Public: can view published listing by slug without token

Nice UX details
Responsive toolbar (mobile hamburger → vertical menu)
Consistent grid tiles, hover/focus states, dark mode friendly
Optional right-click/drag disable on the Preview page

🧱 Tech Stack

Frontend: React (CRA), React Router, Windmill UI/Tailwind utility classes, custom CSS
Backend: Node.js (Express), MongoDB/Mongoose, Nodemailer (SMTP), JSON Web Tokens (JWT)
Storage/Models: Listings, Agents, Files (with nested listingFiles block)
Emails: SMTP provider (e.g., PrivateEmail)
