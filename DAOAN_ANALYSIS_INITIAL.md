# PHÂN TÍCH YÊUR CẦU ĐỒ ÁN VỀ THIẾT KẾ HỆ THỐNG DẪN ĐỘNG THÙNG TRỘN

**Ngày phân tích:** 11/04/2026  
**Đồ án thuộc:** Bách Khoa TP.HCM - Bộ môn Cơ Kỹ Thuật  
**Đề số:** 6 - Thiết Kế Hệ Thống Dẫn Động Thùng Trộn  
**Sinh viên:** Nguyễn Anh Tuấn (Phương án 6)

---

## 📋 THÔNG SỐ THIẾT KẾ

| Thông số | Giá trị | Đơn vị | Ghi chú |
|----------|--------|-------|--------|
| **Công suất trục thùng** | 6.5 | kW | Input từ đồ án |
| **Tốc độ trục thùng** | 60 | v/ph (RPM) | Input từ đồ án |
| **Thời gian phục vụ** | 9 | năm | Input từ đồ án |
| **Chế độ làm việc** | 2 ca | - | Quay một chiều, tải va đập nhẹ |
| **Giờ làm việc/năm** | 4,800 | giờ/năm | (300 ngày × 2 ca × 8 giờ) |
| **Tổng giờ hoạt động** | 43,200 | giờ | (9 năm × 4,800) |

---

## 🔧 HỆ THỐNG TRUYỀN ĐỘNG

### Cấu tạo:
```
[Motor 3pha] 
    ↓ (n₀ ≈ 1450 RPM)
[Belt Drive - Bộ truyền đai thang]
    ↓ (u₁ = ?)
[Bevel Gear - Bánh răng côn]
    ↓ (cấp nhanh)
[Spur Gear - Bánh răng trụ]
    ↓ (u₂ = ?)
[Output Shaft] → 60 RPM
    ↓
[Thùng trộn]
```

### Tỷ số truyền tổng:
$$u_{tổng} = \frac{n_{motor}}{n_{output}} = \frac{1450}{60} ≈ 24.17$$

---

## ✅ YÊU CẦU THIẾT KẾ TỪ ĐỒ ÁN

### 1️⃣ **Xác định công suất động cơ**
- [ ] Tính hiệu suất chung: η = η_đai × η_bánh_răng × η_ổ_lăn
- [ ] Tính công suất động cơ cần thiết: P_motor = P_ct / η
- [ ] Chọn motor từ bảng thông số

### 2️⃣ **Phân bố tỷ số truyền**
- [ ] Xác định u_belt (bộ truyền đai)
- [ ] Xác định u_bevel (bánh răng côn)
- [ ] Xác định u_spur (bánh răng trụ)
- [ ] Constrain: u_belt × u_bevel × u_spur ≈ 24.17

### 3️⃣ **Tính toán bộ truyền đai thang**
**Inputs cần:**
- u_belt
- P_motor
- RPM input

**Outputs cần:**
- Diameter pulley
- Belt width
- Belt type
- Tension

### 4️⃣ **Tính toán bánh răng côn (Cấp nhanh)**
**Inputs cần:**
- Moment input: T₁ = 9550 × P / n (N·m)
- Tỷ số u_bevel
- Vật liệu (thường 20CrMnTi hoặc tương tự)

**Outputs cần (từ file Excel):**
- Khoảng cách trục aw
- Module m
- Số răng z₁, z₂
- Đường kính φd₁, φd₂
- Chiều rộng vành b
- Kiểm tra ứng suất tiếp xúc σH
- Kiểm tra ứng suất uốn σF

**Công thức cơ bản:**
```
T₂ = T₁ / u_bevel
aw = ?  (từ file Excel - phức tạp)
```

### 5️⃣ **Tính toán bánh răng trụ (Cấp chậm)**
**Inputs cần:**
- Moment input: T₂ = T₁ / u_bevel
- Tỷ số u_spur
- Vật liệu
- Output RPM = 60 v/ph

**Outputs cần:**
- Khoảng cách trục aw
- Module m
- Số răng z₃, z₄
- Đường kính φd₃, φd₄
- Chiều rộng vành b
- Kiểm tra ứng suất

### 6️⃣ **Tính toán trục**
**Input:**
- Moment xoắn T (từ gear output)
- Lực từ bánh răng
- Vị trí bearing
- Vật liệu (thường C45 hoặc tương tự)

**Output:**
- Đường kính trục d
- Vị trí, kích thước then
- Kiểm tra ứng suất uốn + xoắn

### 7️⃣ **Chọn ổ lăn**
**Dựa vào:**
- Đường kính trục
- Lực tác dụng
- Tốc độ
- Loại ổ lăn (ball/roller)

### 8️⃣ **Chọn chi tiết khác**
- [ ] Nối trục vòng đàn hồi
- [ ] Thân máy (casting)
- [ ] Bulông (lắp ráp)
- [ ] Dầu bôi trơn
- [ ] Dung sai lắp ghép (IT7, IT8)

---

## 🔍 KÈM THEO: FILE EXCEL TÍNH TOÁN

Bạn cung cấp 4 file Excel:

### 1. **tinh-bánh-răng-côn.xlsx** (3.2 MB)
- Tính toán chi tiết bánh răng côn
- Công thức AGMA hoặc DIN
- Kiểm tra ứng suất tiếp xúc + uốn

### 2. **Chọn động cơ.xlsx** (11.8 KB)
- Bảng chọn motor
- Công suất vs vận tốc
- Kích thước, cân nặng

### 3. **tính bộ truyền đai thang.xlsx** (2.2 MB)
- Tính toán bộ truyền đai
- Khoảng cách, căng dây
- Kiểm tra slip

### 4. **Tính bánh răng trụ răng thẳng.xlsx** (1.5 MB)
- Bánh răng trụ (spur gear)
- Công thức khoảng cách trục
- Kiểm tra ứng suất

---

## ⚠️ CẦN KIỂM TRA

**Để hoàn thiện báo cáo, cần:**
1. ✏️ Mở từng file Excel để đọc công thức chi tiết
2. ✏️ So sánh với công thức đang implement trong code (BE/services/)
3. ✏️ Tìm ra các thiếu sót hoặc sai lệch
4. ✏️ Đưa ra khuyến nghị chỉnh sửa

**Status hiện tại:**
- App hiện có motors, gears, shaft services
- Chưa kiểm tra xem công thức có match với file Excel của đồ án không
- Cần verify: Motor selection, Belt drive, Bevel gear, Spur gear, Shaft, Bearing

---

## 📌 TIẾP THEO

Tôi sẽ:
1. ✅ Phân tích chi tiết từng file Excel
2. ✅ So sánh công thức với backend code
3. ✅ Liệt kê những chỗ thiếu/sai
4. ✅ Tạo implementation plan để sửa lỗi

**Dự kiến:** Báo cáo chi tiết sẽ hoàn thành trong 30 phút.
