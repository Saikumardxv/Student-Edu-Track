# 🚀 EduTrack Deployment and Mobile Testing Guide

This guide explains how to:
1. 📱 **Test the app on mobile devices** (or any other device) during local development.
2. ☁️ **Deploy the frontend and backend permanently** to hosting services like Vercel and Render/Railway.

---

## 📱 Part 1: How to See the App on Mobile Devices (Local Development)

To test the application on your mobile phone or tablet while running it on your computer, use one of the two methods below.

### Method A: Expose via Vite and Local Network (Easiest & Fastest)
If your computer and mobile phone are connected to the **same Wi-Fi network**, you can expose Vite's development server to your local network.

1. **Configure Vite to bind to your network IP:**
   Open a terminal and start the frontend server with the `--host` flag:
   ```bash
   cd frontend
   npm run dev -- --host
   ```
   *(Alternatively, you can edit [package.json](file:///d:/Projects/1/frontend/package.json#L7) in the frontend folder and change the `"dev": "vite"` script to `"dev": "vite --host"`).*

2. **Find the Local Network URL:**
   Once Vite starts, it will output two URLs in your terminal:
   - **Local:** `http://localhost:5173/`
   - **Network:** `http://192.168.x.x:5173/` *(where `192.168.x.x` is your computer's local IP address)*

3. **Access from Mobile:**
   - Open the web browser on your mobile phone.
   - Enter the **Network** URL (e.g., `http://192.168.x.x:5173/`).
   - Vite's proxy automatically routes `/api` requests to your backend at `http://localhost:5000` running on your computer. It will work immediately!

> [!NOTE]
> **Windows Firewall Troubleshooting:** If the page fails to load on your phone, your Windows Firewall might be blocking port `5173`. 
> Go to Windows Firewall settings and allow **Node.js / Vite** to communicate over Private networks.

---

### Method B: Expose via a Public Tunnel (For testing anywhere / mobile data)
If your phone is on mobile data (cellular network) or you want to share your running application with someone else on a different network, you can use a tunnel tool.

1. **Use Pinggy (No installation required):**
   Open a new terminal on your computer and run:
   ```bash
   ssh -R 80:localhost:5173 public@ssh.pinggy.io
   ```
   This will give you a public URL (like `https://xxxx.pinggy.link`) that routes traffic directly to your local Vite server on port `5173`. Open this URL on your mobile phone.

2. **Use Localtunnel (Requires npm):**
   Run the following command:
   ```bash
   npx localtunnel --port 5173
   ```
   Open the generated URL (e.g., `https://xxxx.localtunnel.me`) on your phone.

---

## ☁️ Part 2: Permanent Deployment Guide

Since this is a full-stack project (React frontend + Express API + SQLite database), the best practice is to deploy them separately and link them.

### Recommended Setup:
- **Frontend:** Hosted on **Vercel** (Free, fast static hosting).
- **Backend:** Hosted on **Render.com** / **Railway.app** (if keeping SQLite), or **Vercel** (if migrating to a Cloud Database like PostgreSQL).

---

### Step 1: Deploy the Backend (Render or Railway)
Because the backend uses **SQLite** (a file-based database) and saves user-uploaded files locally, it needs a hosting platform that supports **persistent storage disk** (which Vercel does not support).

#### A. Deploying to Render.com (Recommended)
1. Sign up/log in at [Render](https://render.com/).
2. Create a new **Web Service** and connect your GitHub repository.
3. Configure the settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm run build && npx prisma generate`
   - **Start Command:** `npm start`
4. Add a **Persistent Disk** (under the "Disks" tab in Render settings):
   - **Mount Path:** `/var/data`
   - **Size:** `1 GB` (Plenty for SQLite and student photos)
5. Set the **Environment Variables** (under "Environment" tab):
   - `PORT`: `5000`
   - `JWT_SECRET`: `your-random-secure-string`
   - `JWT_REFRESH_SECRET`: `another-random-secure-string`
   - `DATABASE_URL`: `file:/var/data/dev.db` *(This points the SQLite database to the persistent disk directory so data is never lost during restarts)*
6. In your backend code, ensure uploads are stored on the persistent disk as well by updating the upload path (e.g. to `/var/data/uploads` instead of local `../uploads`).
*(Alternative for Neon/Supabase Postgres: You can use a free PostgreSQL database from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) instead of SQLite. This removes the need for persistent disks!)*

#### B. Deploying to Vercel (Serverless Backend)
We have configured your backend so that it can run on Vercel as a Serverless Function.

> [!WARNING]
> Because Vercel Serverless is stateless, **SQLite is NOT supported**. You must migrate your database to a cloud-hosted PostgreSQL database (such as a free tier database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)).

1. **Modify database provider in schema:**
   Open [schema.prisma](file:///d:/Projects/1/backend/prisma/schema.prisma#L1-L4) and change the provider to `"postgresql"`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Apply migrations to your cloud database:**
   Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
3. **Deploy the Backend to Vercel:**
   - Sign up/log in at [Vercel](https://vercel.com/).
   - Click **Add New** > **Project** and select your GitHub repository.
   - Configure the settings:
     - **Root Directory:** `backend`
   - Add the following **Environment Variables** in Vercel settings:
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `JWT_SECRET`: A secure random string.
     - `JWT_REFRESH_SECRET`: Another secure random string.
   - Click **Deploy**. Vercel will host your backend and compile it serverlessly using the custom [backend/vercel.json](file:///d:/Projects/1/backend/vercel.json) we configured.

> [!NOTE]
> **Static Uploads Limitation:** Local file uploads (profile pictures) will write to `/tmp` and be lost when the Vercel serverless function restarts. To make profile photos permanent on Vercel, you should integrate a cloud storage service like Cloudinary or AWS S3.

---

### Step 2: Deploy the Frontend to Vercel
Vercel is the easiest place to host your React Vite app.

1. Sign up/log in at [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and select your GitHub repository.
3. Configure the settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
4. **Vercel Rewrite Proxy Configuration:**
   To make sure your frontend `/api` requests go to the hosted backend without running into CORS or third-party cookie restrictions:
   - We have created a [vercel.json](file:///d:/Projects/1/frontend/vercel.json) template inside your `frontend` folder.
   - Edit [vercel.json](file:///d:/Projects/1/frontend/vercel.json) and replace `https://your-backend-name.onrender.com` with the actual backend URL given to you by Render or Vercel.
5. Click **Deploy**. Vercel will automatically build the site and provide a permanent public link (e.g., `https://student-edu-track.vercel.app`).
