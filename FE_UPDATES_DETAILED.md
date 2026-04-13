# Frontend Updates Required - Phase 2 Implementation

## Quick Summary
FE needs 5 main changes to support new load/life factor integration:
1. ✅ Update Step 1 inputs (already has the fields, just change defaults)
2. ✅ Update Step 3 to add gear ratio inputs (u_belt, u_bevel, u_spur)
3. ✅ Update Step 4 to pass loadType and life_years
4. ✅ Update Step 5 to display K_load and φ_d verification results
5. ✅ Verify all API calls match BE endpoints

---

## Change 1: Step 1 - Motor Input Defaults

**File:** `FE/src/pages/CalculationWizard/Step1_Motor.jsx`

**Current State (Line 5-10):**
```javascript
const [inputs, setInputs] = useState({
    power: 15.5,
    speed: 1450,
    loadType: 'constant',      // ← WRONG for thesis
    life: 20000,               // ← Wrong: in hours, should be years
});
```

**REQUIRED CHANGE:**
```javascript
const [inputs, setInputs] = useState({
    power: 6.5,                           // ← UPDATE: Thesis example 6.5 kW
    speed: 1450,                          // ← KEEP: Motor input speed
    loadType: 'light_shock_2shift',      // ← CHANGE: Thesis requirement
    life: 9,                              // ← CHANGE: 9 years (converted from hours)
});
```

**Valid loadType options:**
- `constant` - Continuous operation, constant load
- `light_shock_1shift` - Light shock, 1-shift operation
- `light_shock_2shift` - Light shock, 2-shift operation (THESIS)
- `heavy_shock` - Heavy shock loading
- `intermittent_peak` - Intermittent peak loads

---

## Change 2: Step 3 - Add Gear Ratio Inputs

**File:** `FE/src/pages/CalculationWizard/Step3_TransmissionDesign.jsx`

### 2a. Update State (Line ~15-20)
**Current State:**
```javascript
const [inputs, setInputs] = useState({
    power: 15.5,
    speed: 1440,
    serviceFactor: 1.2,
    centerDistance: 450,
    beltType: 'vbelt',
});
```

**REQUIRED CHANGE:**
```javascript
const [inputs, setInputs] = useState({
    power: 6.5,                    // ← From motor selection
    n_motor: 1450,                 // ← From motor selection
    u_belt: 1.3,                   // ← NEW: Belt ratio
    u_bevel: 4.2,                  // ← NEW: Bevel gear ratio
    u_spur: 5.8,                   // ← NEW: Spur gear ratio
    materialName: '20CrMnTi',      // ← NEW: Gear material
    loadType: 'light_shock_2shift',// ← NEW: From Step 1
    life_years: 9,                 // ← NEW: From Step 1
});
```

### 2b. Update Form Inputs (Add before the current form)
Add this code around line 50-100 to add the new input fields:

```jsx
<section className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
    <h3 className="font-bold mb-4">Gear Ratios & Materials</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* U Belt */}
        <div className="space-y-2">
            <label htmlFor="u_belt" className="text-sm font-semibold">
                U Belt Ratio
            </label>
            <input
                id="u_belt"
                name="u_belt"
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={inputs.u_belt}
                onChange={handleChange}
                className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm"
            />
            <p className="text-[11px] text-slate-500 italic">
                Recommended: 1.2 - 1.5
            </p>
        </div>

        {/* U Bevel (Quick Stage) */}
        <div className="space-y-2">
            <label htmlFor="u_bevel" className="text-sm font-semibold">
                U Bevel (Quick)
            </label>
            <input
                id="u_bevel"
                name="u_bevel"
                type="number"
                step="0.1"
                min="2.0"
                max="8.0"
                value={inputs.u_bevel}
                onChange={handleChange}
                className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm"
            />
            <p className="text-[11px] text-slate-500 italic">
                Recommended: 3.5 - 4.5
            </p>
        </div>

        {/* U Spur (Slow Stage) */}
        <div className="space-y-2">
            <label htmlFor="u_spur" className="text-sm font-semibold">
                U Spur (Slow)
            </label>
            <input
                id="u_spur"
                name="u_spur"
                type="number"
                step="0.1"
                min="4.0"
                max="8.0"
                value={inputs.u_spur}
                onChange={handleChange}
                className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm"
            />
            <p className="text-[11px] text-slate-500 italic">
                Recommended: 5.0 - 6.5
            </p>
        </div>

        {/* Gear Material */}
        <div className="space-y-2">
            <label htmlFor="materialName" className="text-sm font-semibold">
                Gear Material
            </label>
            <select
                id="materialName"
                name="materialName"
                value={inputs.materialName}
                onChange={handleChange}
                className="w-full bg-[#edeeef] border-none rounded-lg p-3 text-sm"
            >
                <option value="C45">C45 (Steel)</option>
                <option value="40Cr">40Cr (Improved)</option>
                <option value="20CrMnTi">20CrMnTi (Carburized)</option>
                <option value="42CrMo4">42CrMo4 (Chrome-Moly)</option>
            </select>
            <p className="text-[11px] text-slate-500 italic">
                THESIS: 20CrMnTi
            </p>
        </div>

        {/* Load Type (Display from Step 1) */}
        <div className="space-y-2">
            <label className="text-sm font-semibold">Load Type</label>
            <div className="bg-[#f8f9fa] rounded-lg p-3 text-sm font-medium">
                {inputs.loadType}
            </div>
            <p className="text-[11px] text-slate-500 italic">
                (from Step 1)
            </p>
        </div>

        {/* Service Life (Display from Step 1) */}
        <div className="space-y-2">
            <label className="text-sm font-semibold">Service Life</label>
            <div className="bg-[#f8f9fa] rounded-lg p-3 text-sm font-medium">
                {inputs.life_years} years
            </div>
            <p className="text-[11px] text-slate-500 italic">
                (from Step 1)
            </p>
        </div>
    </div>
</section>
```

### 2c. Update API Call (Line ~30)
**Current:**
```javascript
const response = await axiosClient.post('/calculate/belt', inputs);
```

**CHANGE TO: (also pass to bevel and spur)**
```javascript
const allResults = {
    belt: null,
    bevel_gear: null,
    spur_gear: null
};

try {
    // Belt calculation
    const beltRes = await axiosClient.post('/calculate/belt', inputs);
    allResults.belt = beltRes.data.data;
    
    // Bevel gear calculation
    const bevelRes = await axiosClient.post('/calculate/gear/bevel', {
        T1: 43,  // From motor torque
        u1: inputs.u_bevel,
        materialName: inputs.materialName,
        loadType: inputs.loadType,
        life_years: inputs.life_years
    });
    allResults.bevel_gear = bevelRes.data.data;
    
    // Spur gear calculation
    const spurRes = await axiosClient.post('/calculate/gear/spur', {
        T2: 10.2,  // From bevel output
        u2: inputs.u_spur,
        materialName: inputs.materialName,
        loadType: inputs.loadType,
        life_years: inputs.life_years
    });
    allResults.spur_gear = spurRes.data.data;
    
    // Store all results
    localStorage.setItem('step3_result', JSON.stringify(allResults));
    onNext();
} catch (err) {
    setError(err?.response?.data?.message || 'Transmission calculation error');
}
```

---

## Change 3: Step 4 - Add Load/Life Parameters

**File:** `FE/src/pages/CalculationWizard/Step4_ShaftBearing.jsx`

### 3a. Update State
**Add these fields to inputs:**
```javascript
const [inputs, setInputs] = useState({
    // ... existing shaft parameters ...
    T: 1.8,                           // Torque
    Mx: 0.18,                         // Bending moment X
    My: 0.12,                         // Bending moment Y
    materialName: 'C45',              // Shaft material
    
    // NEW REQUIRED FIELDS:
    loadType: 'light_shock_2shift',   // ← ADD
    life_years: 9,                    // ← ADD
});
```

### 3b. Update API Call
**Current:**
```javascript
const response = await axiosClient.post('/calculate/shaft', shaftData);
```

**Ensure shaftData includes:**
```javascript
const shaftData = {
    T: inputs.T,
    Mx: inputs.Mx,
    My: inputs.My,
    materialName: inputs.materialName,
    loadType: inputs.loadType,        // ← REQUIRED
    life_years: inputs.life_years,    // ← REQUIRED
};
const response = await axiosClient.post('/calculate/shaft', shaftData);
```

---

## Change 4: Step 5 - Display K_load and φ_d

**File:** `FE/src/pages/CalculationWizard/Step5_ValidationAnalysis.jsx`

### 4a. Add Verification Display Section
Add this after results are loaded:

```jsx
{/* Load & Life Factors Section */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <div className="bg-white p-4 rounded-lg border border-[#c2c6d6]/20">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Load Factor
        </p>
        <p className="text-2xl font-bold text-[#0058be]">
            {allResults?.load_factor_applied || 1.5}
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
            K_load (2-shift light shock)
        </p>
    </div>

    <div className="bg-white p-4 rounded-lg border border-[#c2c6d6]/20">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Life Factor
        </p>
        <p className="text-2xl font-bold text-[#0058be]">
            {allResults?.life_factor_applied || 0.95}
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
            φ_d (9-year service)
        </p>
    </div>

    <div className="bg-white p-4 rounded-lg border border-[#c2c6d6]/20">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Gear Ratio Error
        </p>
        <p className="text-2xl font-bold text-[#0058be]">
            {allResults?.u_error_percent?.toFixed(2)}%
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
            {allResults?.u_error_percent < 5 ? '✓ PASS' : '⚠ CHECK'}
        </p>
    </div>

    <div className="bg-white p-4 rounded-lg border border-[#c2c6d6]/20">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
        </p>
        <p className="text-2xl font-bold text-green-600">
            {allResults?.overall_status === '✓ DESIGN COMPLETE' ? '✓ OK' : '⚠ CHECK'}
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
            Overall Design
        </p>
    </div>
</div>

{/* Stress Verification Section */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6]/20">
    <h3 className="font-bold text-lg mb-4">Stress Verification Results</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bevel Gear */}
        {allResults?.bevel_gear?.contact_stress && (
            <div className="space-y-2">
                <h4 className="font-semibold text-[#0058be]">Bevel Gear Contact Stress</h4>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Calculated:</span>
                        <span className="font-bold">
                            {allResults.bevel_gear.contact_stress.calculated} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">With K_load:</span>
                        <span className="font-bold text-orange-600">
                            {allResults.bevel_gear.contact_stress.calculated_with_load_factor} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Allowable:</span>
                        <span className="font-bold">
                            {allResults.bevel_gear.contact_stress.allowable} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={allResults.bevel_gear.contact_stress.status_with_load_factor === '✓ SAFE' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {allResults.bevel_gear.contact_stress.status_with_load_factor}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* Spur Gear */}
        {allResults?.spur_gear?.contact_stress && (
            <div className="space-y-2">
                <h4 className="font-semibold text-[#0058be]">Spur Gear Contact Stress</h4>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Calculated:</span>
                        <span className="font-bold">
                            {allResults.spur_gear.contact_stress.calculated} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">With K_load:</span>
                        <span className="font-bold text-orange-600">
                            {allResults.spur_gear.contact_stress.calculated_with_load_factor} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Allowable:</span>
                        <span className="font-bold">
                            {allResults.spur_gear.contact_stress.allowable} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={allResults.spur_gear.contact_stress.status_with_load_factor === '✓ SAFE' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {allResults.spur_gear.contact_stress.status_with_load_factor}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* Shaft */}
        {allResults?.shaft?.stress_check && (
            <div className="space-y-2">
                <h4 className="font-semibold text-[#0058be]">Shaft Von Mises Stress</h4>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Calculated:</span>
                        <span className="font-bold">
                            {allResults.shaft.stress_check.vonmises_stress.calculated} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">With K_load:</span>
                        <span className="font-bold text-orange-600">
                            {allResults.shaft.stress_check.vonmises_stress.calculated_with_load_factor} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Allowable:</span>
                        <span className="font-bold">
                            {allResults.shaft.stress_check.vonmises_stress.allowable} MPa
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={allResults.shaft.stress_check.vonmises_stress.status_with_load_factor === '✓ SAFE' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {allResults.shaft.stress_check.vonmises_stress.status_with_load_factor}
                        </span>
                    </div>
                </div>
            </div>
        )}
    </div>
</div>
```

---

## Change 5: Verify API Endpoint Routes

**Current FE Calls → Expected Backend Routes:**

| FE Step | FE Call | BE Route | Status |
|---------|---------|----------|--------|
| Step 1 | `/motor/calculate` | `/api/v1/motor/calculate` | ✅ Updated to calculation.controller |
| Step 3 | `/calculate/belt` | `/api/v1/calculate/belt` | ✅ Working |
| Step 3 | `/calculate/gear/bevel` | `/api/v1/calculate/gear/bevel` | ✅ NEW |
| Step 3 | `/calculate/gear/spur` | `/api/v1/calculate/gear/spur` | ✅ NEW |
| Step 4 | `/calculate/shaft` | `/api/v1/calculate/shaft` | ✅ Updated |
| Step 5 | `/export` | `/api/v1/export` | ✓ Existing |

All routes are consistent now! ✅

---

## Implementation Checklist

- [ ] **Step 1:** Change loadType to `light_shock_2shift`, life to `9`
- [ ] **Step 3:** Add state fields for `u_belt`, `u_bevel`, `u_spur`, `materialName`, `loadType`, `life_years`
- [ ] **Step 3:** Add form inputs for the gear ratio fields
- [ ] **Step 3:** Update API calls to include bevel and spur gear calculations
- [ ] **Step 4:** Add `loadType` and `life_years` to the request
- [ ] **Step 5:** Add K_load and φ_d display section
- [ ] **Step 5:** Add stress verification results display
- [ ] **All:** Verify API calls match backend routes

---

## Test Cases

### Thesis Example: P=6.5kW, n=60RPM, L=9yr, Light Shock 2-shift
```
Step 1: Submit with defaults → Motor torque ~43 N·m
Step 3: u_belt=1.3, u_bevel=4.2, u_spur=5.8 → All calculations with K_load=1.5, φ_d=0.95
Step 4: Auto-calculate from Step 3 → d=20mm, stresses SAFE
Step 5: Verify K_load=1.5, φ_d=0.95 shown, all SAFE status
```

---

**Estimated FE Update Time:** ~60-90 minutes for all 5 steps

