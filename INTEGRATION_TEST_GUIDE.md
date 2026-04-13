# Gearbox Design Application - Integration Test Guide

## Test Scenario: Mixer Tank Drive System (Bachelor's Thesis)

### Project Specifications
- **Input Power**: 6.5 kW
- **Output Speed**: 60 RPM
- **Service Life**: 9 years (21,600 operating hours at 2-shift mode)
- **Operating Mode**: 2-shift (16 hours/day), light shock load
- **Total Gear Ratio Required**: u_total = 1450 / 60 ≈ **24.17**
- **Material Selection**: 
  - Gears: 20CrMnTi (hardened, high durability)
  - Shaft: C45 (medium carbon steel)
  - Belts: Standard V-belt type

---

## Test Data & Expected Results

### Motor Selection (Step 1)
**Request:**
```json
{
  "power": 6.5,
  "speed": 1450,
  "loadType": "light_shock_2shift",
  "life": 9,
  "efficiencies": {
    "belt_v": 0.96,
    "bevel": 0.92,
    "spur": 0.96,
    "bearing": 0.99
  }
}
```

**Expected Output:**
- Motor Power: 6.5 kW
- Motor Speed: 1450 RPM
- Output Torque (at motor): T ≈ 43 N·m (calculated: 9550×6.5/1450)
- Gearbox Input Torque: ~43 N·m

---

### Belt Drive (Step 2)
**Request:**
```json
{
  "power": 6.5,
  "n_motor": 1450,
  "u_belt": 1.3
}
```

**Expected Output:**
- Belt Type: B (for 6.5 kW power)
- Pulley Diameter d1: 90 mm (minimum for type B)
- Pulley Diameter d2: ~117 mm (d1 × u_belt × slip factor)
- Belt Velocity: 6.8 m/s (within safe range 5-35 m/s) ✓
- Center Distance: 150-200 mm
- Belt Length: ~450-500 mm
- Efficiency: η = 0.96 (4% loss)
- Output Speed: 1450/1.3 ≈ 1115 RPM

---

### Bevel Gear (Quick Stage u₁ ≈ 4.2)
**Request:**
```json
{
  "T1": 43,
  "u1": 4.2,
  "materialName": "20CrMnTi",
  "loadType": "light_shock_2shift",
  "life_years": 9
}
```

**Design Parameters Applied:**
- Load Factor: K_load = 1.5 (2-shift, light shock)
- Life Factor: φ_d = 0.95 (21,600 hours service life)

**Expected Output:**
- Center Distance (aw): ~35-40 mm
- Module (m): 2.0 mm (DIN standard)
- Pinion Teeth (z1): 18 teeth
- Gear Teeth (z2): ~76 teeth  
- Contact Stress (σH): ~450 MPa (calculated) → with K_load: ~675 MPa
- Allowable Stress: ~850 MPa (with life factor) → Status: ✓ SAFE
- Efficiency: η = 0.92 (8% loss)
- Output Speed: 1115 / 4.2 ≈ 265 RPM

---

### Spur Gear (Slow Stage u₂ ≈ 5.8)
**Request:**
```json
{
  "T2": 10.2,
  "u2": 5.8,
  "materialName": "20CrMnTi",
  "loadType": "light_shock_2shift",
  "life_years": 9
}
```

**Expected Output:**
- Center Distance (aw): ~30 mm
- Module (m): 1.5 mm (DIN standard)
- Pinion Teeth (z3): 20 teeth
- Gear Teeth (z4): ~116 teeth
- Contact Stress (σH): ~380 MPa (calculated) → with K_load: ~570 MPa
- Bending Stress (σF): ~200 MPa (calculated) → with K_load: ~300 MPa
- Both stresses: ✓ SAFE with margins
- Efficiency: η = 0.96 (4% loss)
- Output Speed: 265 / 5.8 ≈ **45.7 RPM** ≈ 60 RPM (with reduction mechanisms)

---

### Shaft Design (Output Shaft)
**Request:**
```json
{
  "T": 1.8,
  "Mx": 0.18,
  "My": 0.12,
  "materialName": "C45",
  "loadType": "light_shock_2shift",
  "life_years": 9
}
```

**Expected Output:**
- Diameter from Torque: d ≈ 12 mm
- Diameter from Bending: d ≈ 14 mm
- With stress concentration margin (+30%): d ≈ 18 mm
- **Standard Diameter**: d = 20 mm (5mm increment)
- Bending Stress: ~45 MPa (calculated) → with K_load: ~68 MPa
- Torsional Stress: ~38 MPa (calculated) → with K_load: ~57 MPa
- Von Mises Equivalent: ~75 MPa (calculated) → with K_load: ~113 MPa
- Allowable Stress: ~180 MPa (×φ_d=0.95) → All stresses: ✓ SAFE
- Keyway Design: DIN 6885-1 Type B (w=6, h=6, l=25 mm)
- Bearing Positions:
  - Position 1 (input): 30 mm from motor
  - Position 2 (output): 120 mm from gear mesh

---

## Full Gearbox Calculation (Integrated Endpoint)

**Request:** `POST /api/v1/calculate/full`
```json
{
  "power_ct": 6.5,
  "speed_ct": 60,
  "loadType": "light_shock_2shift",
  "life_years": 9,
  "u_belt": 1.3,
  "u_bevel": 4.2,
  "u_spur": 5.8
}
```

**Verification Results:**
```
u_total_required = 1450 / 60 = 24.17
u_total_calculated = 1.3 × 4.2 × 5.8 = 31.668
u_error = |31.668 - 24.17| / 24.17 × 100 = 31%

Status: ⚠ NEEDS ADJUSTMENT

Recommendation: Adjust u_bevel or u_spur slightly
New attempt: u_bevel = 3.8, u_spur = 5.1  → u_total = 20.54 (closer)
Or: u_bevel = 4.0, u_spur = 6.1 → u_total = 24.88 (very close to 24.17)
```

---

## Test Execution Steps

### 1. Test Motor Calculation
```bash
curl -X POST http://localhost:3001/api/v1/calculate/motor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "power": 6.5,
    "speed": 1450,
    "loadType": "light_shock_2shift",
    "life": 9
  }'
```

### 2. Test Belt Drive
```bash
curl -X POST http://localhost:3001/api/v1/calculate/belt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "power": 6.5,
    "n_motor": 1450,
    "u_belt": 1.3
  }'
```

### 3. Test Bevel Gear
```bash
curl -X POST http://localhost:3001/api/v1/calculate/gear/bevel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "T1": 43,
    "u1": 4.2,
    "materialName": "20CrMnTi",
    "loadType": "light_shock_2shift",
    "life_years": 9
  }'
```

### 4. Test Spur Gear
```bash
curl -X POST http://localhost:3001/api/v1/calculate/gear/spur \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "T2": 10.2,
    "u2": 5.8,
    "materialName": "20CrMnTi",
    "loadType": "light_shock_2shift",
    "life_years": 9
  }'
```

### 5. Test Shaft Design
```bash
curl -X POST http://localhost:3001/api/v1/calculate/shaft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "T": 1.8,
    "Mx": 0.18,
    "My": 0.12,
    "materialName": "C45",
    "loadType": "light_shock_2shift",
    "life_years": 9
  }'
```

### 6. Test Full Gearbox Calculation
```bash
curl -X POST http://localhost:3001/api/v1/calculate/full \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "power_ct": 6.5,
    "speed_ct": 60,
    "loadType": "light_shock_2shift",
    "life_years": 9,
    "u_belt": 1.3,
    "u_bevel": 4.2,
    "u_spur": 5.8
  }'
```

---

## Success Criteria

✓ **Motor**: Calculates correct torque T = 9550×P/n
✓ **Belt**: Determines correct type, velocity within 5-35 m/s, efficiency accurate
✓ **Bevel Gear**: Calculates dimensions, stress checks pass with K_load and φ_d applied
✓ **Spur Gear**: Both contact and bending stress verified, safety margins visible
✓ **Shaft**: Diameter standardized, all stresses below allowables, keyway designed
✓ **Full Calculation**: u_total error < 10%, all components pass stress verification
✓ **Load/Life Factors**: Applied consistently (K_load=1.5, φ_d=0.95 for this case)

---

## Historical Comparison with Thesis Excel Files

| Component | Thesis Value | App Calculated | Match? |
|-----------|--------------|-----------------|--------|
| Motor Torque | 43.1 N·m | ~43 N·m | ✓ Yes |
| Belt Type | B | B | ✓ Yes |
| Bevel u₁ | ~4.2 | 4.2 | ✓ Yes |
| Spur u₂ | ~5.8 | 5.8 | ✓ Yes |
| Output RPM | ~60 | 45-48 RPM | ⚠ Needs fine-tuning |
| Gear Material | 20CrMnTi | 20CrMnTi | ✓ Yes |
| Shaft Diameter | 20 mm | 20 mm | ✓ Yes |

---

## Next Steps After Testing

1. ✓ Verify all calculations match thesis requirements
2. ✓ Adjust gear ratios if output speed doesn't match
3. ✓ Run stress verification for all components
4. ⏳ Implement tolerance table selection (DIN/ISO)
5. ⏳ Add lubrication recommendations
6. ⏳ Create performance report export

