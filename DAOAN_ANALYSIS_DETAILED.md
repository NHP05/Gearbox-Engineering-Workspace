# KIỂM TRA APP vs YÊU CẦU ĐỒ ÁN - CHI TIẾT

**Ngày kiểm tra:** 11/04/2026  
**Đồ án:** Thiết Kế Hệ Thống Dẫn Động Thùng Trộn  
**Phương án:** 6 (P=6.5kW, n=60 v/ph, L=9 năm)

---

## 🔴 TỔNG HỢP: ĐÃ LÀMV.S CẦN LÀM

| # | Component | Status | Lý do |
|---|-----------|--------|-------|
| 1 | **Motor Selection** | ✅ DONE | Tính P_req, chọn motor, tính u_total |
| 2 | **Belt Drive** | ⚠️ INCOMPLETE | Công thức quá đơn, không có efficiency |
| 3 | **Bevel Gear** | ❌ MISSING | Function không implement, chỉ gọi mà không có |
| 4 | **Spur Gear** | ✅ DONE | Tính aw, module |
| 5 | **Shaft Design** | ⚠️ INCOMPLETE | Chỉ tính d, không tính then, kiểm tra stress |
| 6 | **Bearing Selection** | ✅ DONE (new) | Vừa thêm bearing.service.js |
| 7 | **Moment Torque calc** | ❌ MISSING | T = 9550 × P / n không được tính |
| 8 | **Load Factor** | ❌ MISSING | Không xem xét 2 ca, tải va đập nhẹ |
| 9 | **Stress Check** | ⚠️ INCOMPLETE | Không kiểm tra σH, σF |
| 10 | **Efficiency factors** | ⚠️ INCOMPLETE | Hardcoded, không động |

---

## 🔴 CHI TIẾT 1: MOTOR SERVICE (BE/services/motor.service.js)

### ✅ Đã làm:
```javascript
✓ Tính η_total = η_belt × η_gear × η_bearing
✓ Tính P_req = P_ct / η_total
✓ Chọn motor có power >= P_req
✓ Tính u_total = n_motor / n_ct
```

### ⚠️ Thiếu:
```javascript
❌ Không kiểm tra input efficiencies hợp lệ
❌ Không tính moment xoắn T = 9550 × P / n
❌ Không return tốc độ motor chi tiết
❌ Không kiểm tra constrains (u_total quá lớn/nhỏ?)
```

### 📋 Công thức đúng từ đồ án:
```
Hiệu suất chung:
η = η_đai × η_bánh_răng × η_ổ_lăn

Công suất động cơ cần thiết:
P_motor = P_ct / η

Moment xoắn tại motor:
T_motor = 9550 × P_motor / n_motor

Tỷ số truyền tổng:
u_total = n_motor / n_ct = 1450 / 60 ≈ 24.17
```

**CÁCH SỬA:**
- Thêm tính moment xoắn T = 9550 × P / n
- Thêm validat efficiencies
- Thêm constraints check

---

## 🔴 CHI TIẾT 2: BELT DRIVE SERVICE (BE/services/belt.service.js)

### ❌ Vấn đề lớn:
```javascript
// HIỆN TẠI - quá đơn giản:
const calculateBeltDrive = async (P_req, n_motor, u_belt) => {
    let beltType = 'A';
    if (P_req > 5) beltType = 'B';   // ← Ngây thơ
    // ...
}

// CẦN:
- Công thức tính from file: tính bộ truyền đai thang.xlsx
- Xem xét loại đai (V-belt, timing belt)
- Tính căng dây, kiểm tra slip
- Tính hiệu suất η_belt (input để tính P_req motor)
- Tính khoảng cách trục ký thể tiêu chuẩn
```

### 📋 Công thức cần thiết từ file Excel:
```
1. Xác định loại đai dựa trên:
   - Công suất P
   - Vận tốc (m/s)
   - Khoảng cách trục

2. Tính đường kính bánh đai:
   - d1 ≥ d1_min (theo chuẩn)
   - d2 = d1 × u_belt

3. Tính căng dây:
   - F = P / v (N)
   - Kiểm tra F ≤ F_max

4. Tính khoảng cách trục:
   - a ≥ (d1 + d2) / 2
   - a ≤ 3 × (d1 + d2)

5. Hiệu suất:
   - η_belt ≈ 0.95 (hoặc từ bảng)
```

---

## 🔴 CHI TIẾT 3: BEVEL GEAR (MISSING!)

### ❌ Vấn đề:
```javascript
// Trong controller:
const calcBevelGear = async (req, res) => {
    // ...
    const result = await gearService.calculateBevelGear(T1, u1, materialName);
    // ↑ Hàm này KHÔNG TỒN TẠI!
}

// Trong gear.service.js:
module.exports = { calculateSpurGear };  // ← Chỉ export Spur, không có Bevel
```

### 📋 Cần implement:
```javascript
const calculateBevelGear = async (T1, u1, materialName) => {
    // 1. Lấy vật liệu (20CrMnTi)
    // 2. Tính aw (khoảng cách trục)
    // 3. Tính modul m
    // 4. Tính số răng z1, z2
    // 5. Tính đường kính d1, d2
    // 6. Kiểm tra σH (ứng suất tiếp xúc)
    // 7. Kiểm tra σF (ứng suất uốn)
    // 8. Return results
}
```

### Công thức từ file Excel:
```
Bánh răng côn lẩu (tinh-bánh-răng-côn.xlsx):
- Tính aw = f(T1, u1, material) [phức tạp]
- Kiểm tra σH ≤ σH_allow
- Kiểm tra σF ≤ σF_allow
- Tính chiều rộng vành b
```

---

## 🔴 CHI TIẾT 4: SPUR GEAR (BE/services/gear.service.js)

### ✅ Đã làm:
```javascript
✓ Công thức tính aw (khoảng cách trục)
✓ Chuẩn hóa aw theo bội 5
✓ Tính modul m = 0.01 × aw
✓ Lấy σH_allow từ database
```

### ⚠️ Thiếu:
```javascript
❌ Không tính số răng z3, z4
❌ Không tính đường kính d3, d4
❌ Không tính chiều rộng vành b
❌ Không kiểm tra ứng suất uốn σF
❌ Không kiểm tra ứng suất tiếp xúc σH
❌ Không validate output constraints
❌ Hệ số Ka=43 hardcoded (nên từ bảng)
```

### 📋 Công thức tính đầy đủ spur gear:
```
Input: T2, u2, material

1. Tính modul:
   m = 0.01 × aw_std

2. Tính số răng:
   z3 + z4 = (u2 + 1) × z3
   z3 ≥ z3_min (thường 17-20)

3. Tính đường kính:
   d3 = m × z3
   d4 = m × z4

4. Tính chiều rộng vành:
   b = ψ_ba × aw

5. Kiểm tra ứng suất tiếp xúc:
   σH = f(T2, aw, b, z3, z4, KHbeta)
   Check: σH ≤ σH_allow

6. Kiểm tra ứng suất uốn:
   σF = f(T2, z3, b, m)
   Check: σF ≤ σF_allow
```

---

## 🔴 CHI TIẾT 5: SHAFT DESIGN (BE/services/shaft.service.js)

### ✅ Đã làm:
```javascript
✓ Tính M_total từ Mx, My
✓ Tính d_min theo công thức xoắn
✓ Chuẩn hóa d theo bội 5
```

### ❌ Thiếu nhiều:
```javascript
❌ Không tính moment xoắn từ công suất
❌ Không tính vị trí bearings
❌ Không tính then (ketway)
❌ Không kiểm tra ứng suất uốn σ
❌ Không kiểm tra ứng suất xoắn τ
❌ Không kiểm tra ứng suất Von Mises
❌ Không xem xét stress concentration
❌ σ_allow hardcoded = 60 MPa (C45)
```

### 📋 Quy trình thiết kế trục đúng:
```
Input: T (moment xoắn), M_bending (moment uốn), material

1. Chọn vật liệu (C45, 40Cr):
   σ_b = 540 - 640 MPa
   σ_allow = σ_b / (2 ~ 3)

2. Tính moment xoắn từ công suất:
   T = 9550 × P / n (N·m)

3. Tính moment uốn:
   M = f(lực từ gear)

4. Tính đường kính sơ bộ (xoắn):
   d ≥ ∛(32×T / (π×τ_allow))

5. Tính đường kính sơ bộ (uốn):
   d ≥ ∛(32×M / (π×σ_allow))

6. Lấy MAX của 2 giá trị

7. Chuẩn hóa d theo chuẩn (5, 10 mm)

8. Kiểm tra Von Mises:
   σ_eq = √(σ² + 3τ²)
   Check: σ_eq ≤ σ_allow

9. Thiết kế then (ketway):
   - Kích thước a × b × c
   - Vị trí trên trục

10. Xác định vị trí bearing:
    - Khoảng cách từ gear
    - Size bearing
```

---

## 🔴 CHI TIẾT 6: KHÔNG TÍNH MOMENT XOẮN

### ❌ Vấn đề lớn:
```
Input của frontend:
- P = 6.5 kW
- n = 60 RPM

Nhưng code NEVER tính:
T = 9550 × P / n

Ví dụ:
T_output = 9550 × 6.5 / 60 = 1030.875 N·m

Đây là moment PHẢI dùng để tính:
- Bánh răng côn (T1)
- Bánh răng trụ (T2 = T1/u1)
- Trục (T)
```

### Cần thêm function:
```javascript
// Calculate moment from power
const calculateMoment = (power_kW, speed_RPM) => {
    // T = 9550 × P / n  (T in N·m)
    const T = 9550 * power_kW / speed_RPM;
    return T;
}
```

---

## 🔴 CHI TIẾT 7: LOAD FACTOR & EFFICIENCY

### ❌ Thiếu:
```javascript
Đồ án quy định:
- Quay một chiều
- Làm việc 2 ca
- Tải va đập nhẹ
- Thời gian 9 năm (21,600 giờ)

ỨNG DỤNG:
Khi tính φd(life factor):
φd = f(L) = f(21,600 giờ)

Khi tính load factor:
K_load = 1.0 (tải va đập nhẹ)

Khi tính dynamic factor:
K_v = f(speed) [từ bảng]

Khi tính efficiency:
η_belt = 0.95 ~ 0.97 (V-belt)
η_bevel = 0.90 ~ 0.93 (bánh nón)
η_spur = 0.94 ~ 0.97 (bánh trụ)
η_bearing = 0.99 (ổ lăn)
```

**Hiện tại:** Hardcoded trong frontend (lấy từ input)
**Nên:** Tính tự động dựa vào loại gear + speed

---

## 🟡 CHI TIẾT 8: KIỂM TRA ỨNG SUẤT

### ❌ Không làm:
```javascript
Bánh răng côn:
- σH < σH_allow (tiếp xúc)
- σF < σF_allow (uốn)

Bánh răng trụ:
- σH < σH_allow (tiếp xúc)
- σF < σF_allow (uốn)

Trục:
- σ < σ_allow (uốn)
- τ < τ_allow (xoắn)
- σ_eq < σ_allow (Von Mises)

Ổ lăn:
- L10 > L (vòng tròn cuộc sống)
- Dynamic load < C_dynamic
```

---

## 📋 DANH SÁCH SỬA LỖI (PRIORITY)

### Priority 1 (CRITICAL):
- [ ] **Implement calculateBevelGear()** - Hiện tại gọi function không có
- [ ] **Add calculateMoment()** - Tính T từ P, n
- [ ] **Update motor.service.js** - Return moment, validate efficiency
- [ ] **Improve belt.service.js** - Add proper formula, efficiency

### Priority 2 (HIGH):
- [ ] **Complete spur gear** - Add teeth count, diameter, stress checks
- [ ] **Complete shaft design** - Add ketway, bearing positions, Von Mises
- [ ] **Add load factors** - Consider 2-shift operation, light shock
- [ ] **Add life factor** - Consider 9-year (21,600 hour) design life

### Priority 3 (MEDIUM):
- [ ] **Add stress verification** - σH, σF checks
- [ ] **Add efficiency tables** - Dynamic calculation
- [ ] **Add constraints** - aw_min/max, m_std, etc.
- [ ] **Add safety reports** - Show all intermediate calculations

### Priority 4 (NICE-TO-HAVE):
- [ ] **Add 3D force diagram** - Visualization
- [ ] **Add material database** - Auto-fill properties
- [ ] **Add tolerance table** - DIN, ISO standard
- [ ] **Add lubrication recommendations** - Oil selection

---

## 📊 CODE STRUCTURE RECOMMENDATION

```
BE/
├── utils/
│   ├── calculators/
│   │   ├── motorCalc.js      [functions: tính moment, P, u, etc.]
│   │   ├── beltCalc.js       [functions: tính aw, pulleys, etc.]
│   │   ├── bevelCalc.js      [NEW - functions: tính aw, stress, etc.]
│   │   ├── spurCalc.js       [functions: tính z, d, stress, etc.]
│   │   ├── shaftCalc.js      [functions: tính d, ketway, stress, etc.]
│   │   └── bearingCalc.js    [functions: tính load, L10, etc.]
│   │
│   └── constants/
│       ├── materials.js      [E, ν, σ_b, τ_allow for C45, 40Cr, etc.]
│       ├── gearFactors.js    [Ka, Kv, KHbeta, etc. tables]
│       ├── beltData.js       [Belt type, d_min, η]
│       └── standards.js      [DIN, ISO modules, tooth counts]
│
├── services/
│   ├── motor.service.js      [REWRITE - use motorCalc]
│   ├── belt.service.js       [REWRITE - use beltCalc + add efficiency]
│   ├── gear.service.js       [REWRITE - add bevelCalc + improve spurCalc]
│   ├── shaft.service.js      [REWRITE - use shaftCalc + add ketway]
│   └── bearing.service.js    [OK but improve]
│
└── controllers/
    └── calculation.controller.js [ADD validation + intermediate steps]
```

---

## 🎯 ESTIMATE

- **Bevel Gear (Priority 1):** 2-3 tiếng
- **Motor Moment + validation:** 1-2 tiếng
- **Belt Drive improve:** 2-3 tiếng
- **Spur Gear complete:** 2-3 tiếng
- **Shaft design complete:** 3-4 tiếng
- **Stress verification:** 3-4 tiếng
- **Testing + debugging:** 4-5 tiếng

**TOTAL:** 17-24 tiếng công việc

---

## ✅ CONCLUSION

**Status:** App hiện tại **~50% hoàn thiện**

**Khía cạnh tốt:**
- ✅ Motor selection logic OK
- ✅ Basic calculations present
- ✅ Bearing selection (new)
- ✅ Export functionality (new)

**Khía cạnh cần sửa ngay:**
- ❌ Bevel gear missing
- ❌ No moment calculation
- ❌ No stress verification
- ❌ No load factor consideration
- ❌ Belt formula too simple

**Status so sánh với đồ án:** Khoảng 50-60% yêu cầu đồ án

Tôi sẽ tạo một **detailed implementation guide** nếu bạn muốn?
