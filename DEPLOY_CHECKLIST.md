# ⚡ Quick Deploy Checklist

## Bước 1️⃣: Chuẩn bị (5 phút)

- [ ] Copy file `.env.example` → `.env` trong thư mục `BE`
- [ ] Edit `BE/.env` với thông tin database:
  ```bash
  DB_HOST=your_mysql_host
  DB_USER=your_user  
  DB_PASSWORD=your_password
  DB_NAME=gearbox_db
  ```
- [ ] Kiểm tra `FE/src/api/axiosClient.js` có config API URL chưa

---

## Bước 2️⃣: Deploy Backend lên Render (10 phút)

1. Truy cập: https://render.com → Đăng ký/Đăng nhập
2. Click **"New +"** → **"Web Service"** → Connect GitHub
3. Cấu hình:
   - **Root Directory**: `BE`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   DB_HOST=your_host
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=gearbox_db
   CORS_ORIGIN=http://localhost:5173,https://your-fe.vercel.app
   JWT_SECRET=your_secret_key
   ```
5. Deploy → Chờ URL BE (ví dụ: `https://gearbox-backend.onrender.com`)

---

## Bước 3️⃣: Deploy Frontend lên Vercel (5 phút)

1. Truy cập: https://vercel.com → Đăng ký/Đăng nhập
2. Click **"Add New Project"** → Import GitHub
3. Cấu hình:
   - **Root Directory**: `FE`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Vite
4. Add Environment Variables:
   ```
   VITE_API_URL=https://gearbox-backend.onrender.com/api
   ```
5. Deploy → Chờ URL FE (ví dụ: `https://your-app.vercel.app`)

---

## Bước 4️⃣: Cập nhật CORS trên Render

1. Quay lại Render dashboard
2. Edit biến `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
   ```
3. Redeploy backend

---

## ✅ Test kết nối

### Test Backend
```bash
curl https://gearbox-backend.onrender.com/api/v1/test
```
Nên thấy: `{"success":true,"message":"Backend is running"}`

### Test Frontend
1. Mở browser: `https://your-app.vercel.app`
2. Mở Developer Tools (F12) → Network tab
3. Gọi API từ console:
   ```javascript
   fetch('https://gearbox-backend.onrender.com/api/v1/test')
   ```
4. Không có lỗi CORS → ✅ OK!

---

## 🐛 Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-----------|---------|
| **CORS Error** | CORS_ORIGIN chưa cập nhật | Cập nhật biến trên Render |
| **502 Bad Gateway** | Backend không khởi động | Kiểm tra logs Render |
| **API không gọi được** | VITE_API_URL sai | Kiểm tra `axiosClient.js` |
| **Render free tier chậm** | Service "sleep" 15 phút | Nâng cấp paid tier |

---

## 📱 Localhost Testing (không deploy)

```bash
# Terminal 1 - Backend
cd BE
npm install
npm run dev

# Terminal 2 - Frontend  
cd FE
npm install
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 📚 Đọc thêm
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Hướng dẫn chi tiết
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
