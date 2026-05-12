# 🚀 Hướng dẫn Deploy: FE (Vercel) + BE (Render)

## 📌 Tổng quan
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Express.js)
- **Database**: MySQL (bạn tự host hoặc dùng cloud DB)

---

## 🔧 PHẦN 1: Chuẩn bị BE trước khi deploy

### Step 1: Tạo file `.env` từ `.env.example`
```bash
cp BE/.env.example BE/.env
```

### Step 2: Edit file `BE/.env` với thông tin thực tế
```env
NODE_ENV=production
PORT=8080
DB_HOST=your_mysql_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=gearbox_db
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
JWT_SECRET=your_super_secret_key_here
```

### Step 3: Update CORS trong `BE/app.js`

Thay đổi từ:
```javascript
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', ...],
    credentials: true,
}));
```

Thành:
```javascript
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 🌐 PHẦN 2: Deploy Backend lên Render

### Step 1: Tạo tài khoản Render
1. Truy cập: https://render.com
2. Đăng ký với GitHub (khuyên dùng để auto-deploy)

### Step 2: Tạo New Web Service
1. Click **"New +"** → **"Web Service"**
2. Kết nối GitHub repo của bạn
3. Cấu hình:
   - **Name**: `gearbox-backend` (hoặc tên khác)
   - **Branch**: `main`
   - **Root Directory**: `BE` ← **Quan trọng!**
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
   - **Environment**: Node

### Step 3: Set Environment Variables trên Render
Trong Render dashboard, tìm mục **"Environment"**:
```
NODE_ENV=production
PORT=8080
DB_HOST=your_mysql_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=gearbox_db
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
JWT_SECRET=your_super_secret_key
```

### Step 4: Deploy
- Render sẽ tự động deploy khi bạn push lên GitHub
- Sau ~2-3 phút, bạn sẽ nhận được URL: `https://gearbox-backend.onrender.com`

✅ Test: Truy cập `https://gearbox-backend.onrender.com/api/v1/test`

---

## 🎨 PHẦN 3: Deploy Frontend lên Vercel

### Step 1: Chuẩn bị FE

**Cập nhật API endpoint** trong `FE/src/api/axiosClient.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

export default axiosClient;
```

**Tạo file `.env.production`** trong thư mục `FE/`:
```
VITE_API_URL=https://gearbox-backend.onrender.com/api
```

**Cập nhật `FE/vite.config.js`** để nhận env vars:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  }
})
```

### Step 2: Deploy lên Vercel
1. Truy cập: https://vercel.com
2. Click **"Add New Project"**
3. Import GitHub repo
4. Cấu hình:
   - **Framework**: Vite
   - **Root Directory**: `FE`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables
Trong Vercel dashboard → **"Settings"** → **"Environment Variables"**:
```
VITE_API_URL=https://gearbox-backend.onrender.com/api
```

### Step 4: Deploy
- Vercel sẽ tự động build & deploy
- Bạn sẽ nhận được URL: `https://your-app.vercel.app`

---

## 🔗 PHẦN 4: Kết nối FE - BE

### Cập nhật CORS_ORIGIN trên Render
Sau khi có URL Vercel, cập nhật biến `CORS_ORIGIN` trên Render:
```
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
```

### Test kết nối
1. Mở console FE: `https://your-app.vercel.app`
2. Gọi API test:
```javascript
fetch('https://gearbox-backend.onrender.com/api/v1/test')
  .then(r => r.json())
  .then(d => console.log(d))
```

Nếu thấy `{ success: true, message: 'Backend is running' }` → ✅ OK!

---

## ⚠️ Lưu ý quan trọng

1. **Database**: 
   - Nếu chưa có server DB riêng, xem xét dùng:
     - PlanetScale (MySQL hosted)
     - Aiven MySQL (free tier)
     - Railway (có db built-in)

2. **Render Free Tier**:
   - Service sẽ "sleep" sau 15 phút không dùng
   - Lần đầu tiên gọi sẽ chậm (~30s)
   - Để tránh: Nâng cấp lên paid tier

3. **Vercel Free Tier**:
   - Deploy miễn phí, giới hạn 1000 requests/ngày
   - Đủ cho dev/testing

---

## 🆘 Troubleshooting

**CORS Error?**
- Kiểm tra `CORS_ORIGIN` trên Render
- Xác nhận URL Vercel chính xác

**Database Connection Error?**
- Kiểm tra `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Render có thể không kết nối được MySQL local → cần upload DB lên cloud

**BE chạy nhưng FE không gọi được?**
- Kiểm tra `VITE_API_URL` ở FE
- Xem Network tab trong DevTools

---

## 📚 Tài liệu tham khảo
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Express CORS: https://github.com/expressjs/cors
