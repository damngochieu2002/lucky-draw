# Lucky Draw 🎰

Hệ thống quay số trúng thưởng với real-time updates.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Express.js + Socket.io
- **Database**: SQLite (better-sqlite3)

## Local Development

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

---

## 🚀 Deploy lên Railway

### Bước 1: Push code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Bước 2: Tạo Railway Project

1. Truy cập [railway.app](https://railway.app) và đăng nhập bằng GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repository Lucky Draw

### Bước 3: Deploy Backend (Server)

1. Trong project, click **"New Service"** → **"GitHub Repo"**
2. Chọn repo và cấu hình:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Railway sẽ tự động tạo URL cho server (VD: `server-production-xxxx.up.railway.app`)

### Bước 4: Deploy Frontend (Client)

1. Click **"New Service"** → **"GitHub Repo"**
2. Chọn repo và cấu hình:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve dist -s`
3. Thêm Environment Variables:
   ```
   VITE_API_URL=https://<server-url>/api
   VITE_SOCKET_URL=https://<server-url>
   ```
   *(Thay `<server-url>` bằng URL của server từ bước 3)*

### Bước 5: Verify

Truy cập URL của client service để kiểm tra website hoạt động.

---

## Environment Variables

### Client (.env)
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Server
```
PORT=3000  # Railway tự động set
```
