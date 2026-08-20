# Coding Tracker

A secure, multi-user, multi-device tracking application for VS Code.

## Overview
Coding Tracker records your coding activity, commit history, and code snapshots seamlessly directly from VS Code. 

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript, Mongoose
- **Database**: MongoDB Atlas
- **Extension**: VS Code Extension API

## Local Development
1. **Database**: Create a MongoDB Atlas cluster and get the connection string.
2. **Backend**:
   ```bash
   cd backend
   npm install
   # Create .env with MONGODB_URI, JWT_SECRET, PORT
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Extension**:
   Open `vscode-extension` in VS Code and press F5 to run in a dev window.

## Environment Variables
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key for signing JWT tokens.
- `PORT`: Backend port (default 5000).
- `FRONTEND_URL`: CORS origin (default http://localhost:5173).

## Security Architecture
- JSON Web Tokens for API authentication.
- Secure hashed device tokens for extension sync.
- Rate limiting, Helmet, HPP, and CORS restricted.
- Full data isolation enforcing DB queries to include authenticated user IDs.

## Offline Queue
The VS Code extension utilizes a resilient offline queue. If the backend is unreachable, it seamlessly buffers events and flushes them efficiently upon reconnection. Idempotency keys (`eventId`) prevent double recording.

## Backup and Recovery
All data is stored in MongoDB Atlas, which provides automated daily backups. Users can manually export their history as a JSON archive from the web Profile dashboard.
