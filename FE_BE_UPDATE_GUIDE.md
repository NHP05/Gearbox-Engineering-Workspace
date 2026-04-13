# Phase 2 Implementation: Database & Frontend Changes Guide

## Summary of Changes Required

### 1. DATABASE UPDATES ✅
✅ **File prepared**: `DB/SCHEMA_UPDATE_PHASE2.sql`
- Adds `u_belt`, `u_bevel`, `u_spur` to design_variants table
- Adds `material_gear`, `material_shaft` fields
- Adds `load_type`, `life_years` fields
- Creates `calculation_results` table to store intermediate results
- Creates `load_factor_mappings` table (K_load reference)
- Creates `life_factor_mappings` table (φ_d reference)

**To apply database updates:**
```bash
mysql -u root -p gearbox_db < DB/SCHEMA_UPDATE_PHASE2.sql
```

---

## 2. BACKEND ROUTE UPDATES

### Current Issue:
- FE calls `/motor/calculate` → motorController.getMotorcalculate (OLD)
- New calculation engine in calculation.controller (NEW)
- FE calls `/calculate/belt`, `/calculate/shaft` → calculationController (NEW) ✓

### Solution: Update motor.routes.js
**Before:**
```javascript
const motorController = require('../controllers/motor.controller');
router.post('/calculate', motorController.getMotorcalculate);
```

**After (CHANGE THIS):**
```javascript
const calculationController = require('../controllers/calculation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
router.post('/calculate', verifyToken, calculationController.calcMotor);
```

---

## 3. FRONTEND API ENDPOINT UPDATES

### Current FE Endpoints vs BE Routes

| Step | Current FE Call | BE Route | Status | Action |
|------|-------------------|----------|--------|--------|
| **Step 1** | POST `/motor/calculate` | `/api/v1/motor/calculate` | ⚠️ OLD | Update motor.routes ✓ (see above) |
| **Step 2** | (check needed) | Should call functions | Check | Verify or update |
| **Step 3** | POST `/calculate/belt` | `/api/v1/calculate/belt` | ✅ NEW | No change needed |
| **Step 4** | POST `/calculate/shaft` | `/api/v1/calculate/shaft` | ✅ NEW | No change needed |
| **Step 5** | POST `/export` | `/api/v1/export` | ✅ Exists | May need update for new fields |

---

## 4. FRONTEND COMPONENT CHANGES

### Step 1 (Motor Selection) - `Step1_Motor.jsx`
**Current state:** Already has `loadType` and `life` inputs ✓
**What to verify:**
- loadType values should match BE expectations:
  - Options: `constant`, `light_shock_1shift`, `light_shock_2shift`, `heavy_shock`, `intermittent_peak`
  - Current: `constant` (default)
  - **For thesis**: Should default to `light_shock_2shift`

**Required change:**
```javascript
// Line 5-6: Update default loadType
const [inputs, setInputs] = useState({
    power: 15.5,
    speed: 1450,
    loadType: 'light_shock_2shift',  // ← CHANGE FROM 'constant'
    life: 9,  // ← CHANGE FROM 20000 (now in years, not hours)
});
```

---

### Step 2 (Motor Selection) - `Step2_MotorSelection.jsx`
**Current state:** Check if this step exists and what it does

**Needed actions:**
1. Check if Step 2 displays motor selection results
2. Should allow selection from motors table
3. Should pass motor_id/motor_name to next steps

---

### Step 3 (Transmission Design) - `Step3_TransmissionDesign.jsx`
**Current state:** Has belt parameters but missing gear ratio inputs

**Required changes:**

```jsx
// ADD these input fields for gear ratios:

// Line ~17: Expand inputs state to include gear ratios
const [inputs, setInputs] = useState({
    power: 15.5,
    n_motor: 1450,
    u_belt: 1.3,         // ← ADD
    u_bevel: 4.2,        // ← ADD
    u_spur: 5.8,         // ← ADD
    materialName: '20CrMnTi',  // ← ADD or verify
    loadType: 'light_shock_2shift',  // ← ADD
    life_years: 9,       // ← ADD
});

// Line ~50-80: Add input form fields
<div className="grid grid-cols-2 gap-6">
    <div className="space-y-2">
        <label>U Belt Ratio</label>
        <input
            name="u_belt"
            type="number"
            step="0.1"
            value={inputs.u_belt}
            onChange={handleChange}
            className="w-full bg-[#edeeef] border-none rounded-lg p-3"
        />
        <p className="text-[11px] text-slate-500">Recommended: 1.2-1.5</p>
    </div>
    
    <div className="space-y-2">
        <label>U Bevel (Quick Stage)</label>
        <input
            name="u_bevel"
            type="number"
            step="0.1"
            value={inputs.u_bevel}
            onChange={handleChange}
            className="w-full bg-[#edeeef] border-none rounded-lg p-3"
        />
        <p className="text-[11px] text-slate-500">Recommended: 3.5-4.5</p>
    </div>
    
    <div className="space-y-2">
        <label>U Spur (Slow Stage)</label>
        <input
            name="u_spur"
            type="number"
            step="0.1"
            value={inputs.u_spur}
            onChange={handleChange}
            className="w-full bg-[#edeeef] border-none rounded-lg p-3"
        />
        <p className="text-[11px] text-slate-500">Recommended: 5.0-6.5</p>
    </div>
    
    <div className="space-y-2">
        <label>Gear Material</label>
        <select
            name="materialName"
            value={inputs.materialName}
            onChange={handleChange}
            className="w-full bg-[#edeeef] border-none rounded-lg p-3"
        >
            <option>20CrMnTi</option>
            <option>40Cr</option>
            <option>C45</option>
            <option>42CrMo4</option>
        </select>
    </div>
</div>
```

---

### Step 4 (Shaft & Bearing) - `Step4_ShaftBearing.jsx`
**Current state:** Calls `/calculate/shaft` with belt data

**Required changes:**
```jsx
// Verify input structure matches BE requirements:
// Should have: T, Mx, My, materialName, loadType, life_years

const [shaftData, _] = useState({
    T: someValue,        // Torque in N·m
    Mx: someValue,       // Bending moment X
    My: someValue,       // Bending moment Y
    materialName: 'C45', // Shaft material
    loadType: 'light_shock_2shift',  // ← ADD
    life_years: 9,       // ← ADD
});

// Verify POST call includes these parameters:
const response = await axiosClient.post('/calculate/shaft', shaftData);
```

---

### Step 5 (Validation) - `Step5_ValidationAnalysis.jsx`
**Current state:** Displays results and exports

**Required changes:**
1. Display K_load and φ_d values applied
2. Show verification results including:
   - `u_total_calculated` vs `u_total_required`
   - `u_error_percent` and status
   - All stress verification results with load/life factors
3. Update export to include these new fields

```jsx
// In results display, show:
<div className="results-grid">
    <div className="metric">
        <label>Load Factor (K_load)</label>
        <value>{results.K_load} (2-shift light shock)</value>
    </div>
    <div className="metric">
        <label>Life Factor (φ_d)</label>
        <value>{results.φ_d} (9-year service)</value>
    </div>
    <div className="metric">
        <label>Gear Ratio Error</label>
        <value>{results.u_error_percent}%
            {results.u_error_percent < 5 ? '✓ PASS' : '⚠ CHECK'}
        </value>
    </div>
    {/* Detail results from each step... */}
</div>
```

---

## 5. CONFIGURATION CHECKLIST

### Backend Verification
- [ ] motor.routes.js updated to use calculation.controller ✓ (see section 2)
- [ ] calculation.routes.js has all endpoints ✓
- [ ] calculation.controller.js exports all functions ✓
- [ ] All services use K_load and φ_d ✓
- [ ] Database schema updated ✓

### Frontend Verification  
- [ ] Step 1: loadType = 'light_shock_2shift', life = 9 (years)
- [ ] Step 3: Inputs for u_belt, u_bevel, u_spur, material
- [ ] Step 4: Inputs for loadType, life_years
- [ ] Step 5: Displays K_load, φ_d, verification results
- [ ] All API calls use correct endpoints

### Database Verification
- [ ] Schema updates applied (`SCHEMA_UPDATE_PHASE2.sql`)
- [ ] design_variants has new columns
- [ ] calculation_results table created
- [ ] Load/life factor reference tables populated

---

## 6. TESTING FLOW

### Test Case: Thesis Example (P=6.5kW, n=60RPM, L=9yr, 2-shift light shock)

**Step 1:**
```
Input: power=6.5, speed=1450, loadType=light_shock_2shift, life=9
Expected: Motor selected, T≈43 N·m calculated
```

**Step 3:**
```
Input: u_belt=1.3, u_bevel=4.2, u_spur=5.8, materialName=20CrMnTi
Expected: 
- Belt type B selected
- All 3 calculations with K_load=1.5, φ_d=0.95 applied
- u_total≈31.67 (close to 24.17 target)
```

**Step 4:**
```
Input: T≈1.8, Mx≈0.18, My≈0.12, materialName=C45
Expected:
- d_standard = 20mm
- All stresses SAFE with load/life factors
```

**Step 5:**
```
Display verification:
- K_load = 1.5 ✓
- φ_d = 0.95 ✓
- Overall status: ✓ DESIGN COMPLETE
```

---

## 7. PRIORITY OF CHANGES

**Must Do (Critical):**
1. ✅ Apply database schema updates
2. Update motor.routes.js to use calculation.controller
3. Update Step 1 inputs: loadType='light_shock_2shift', life=9
4. Add Step 3 gear ratio inputs (u_belt, u_bevel, u_spur)
5. Add Step 4 loadType, life_years inputs

**Should Do (Important):**
6. Update Step 5 to display K_load, φ_d, verification
7. Verify all API endpoints match BE routes
8. Test end-to-end with thesis example data

**Nice to Have (Optional):**
9. Add visualization for load/life factor effects
10. Add recommendations for gear ratio adjustments
11. Add alternative design suggestions

---

## 8. ESTIMATED EFFORT

| Task | Time | Priority |
|------|------|----------|
| DB schema update + test | 15 min | CRITICAL |
| motor.routes.js update | 5 min | CRITICAL |
| Step 1 FE updates | 5 min | CRITICAL |
| Step 3 FE gear inputs | 20 min | CRITICAL |
| Step 4 FE inputs verify | 10 min | CRITICAL |
| Step 5 FE display update | 30 min | IMPORTANT |
| End-to-end testing | 45 min | CRITICAL |
| **TOTAL** | **~2 hours** | |

---

## 9. FILES TO MODIFY/CREATE

### Create:
- ✅ `DB/SCHEMA_UPDATE_PHASE2.sql` - Already created

### Modify:
1. `BE/routes/motor.routes.js` - Route to new controller
2. `FE/src/pages/CalculationWizard/Step1_Motor.jsx` - Update defaults
3. `FE/src/pages/CalculationWizard/Step3_TransmissionDesign.jsx` - Add gear ratio inputs
4. `FE/src/pages/CalculationWizard/Step4_ShaftBearing.jsx` - Add loadType, life inputs
5. `FE/src/pages/CalculationWizard/Step5_ValidationAnalysis.jsx` - Display K_load, φ_d

---

**Next Step:** Apply database schema update and run tests!

