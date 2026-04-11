# CNPM DADN - Gearbox Engineering Workspace

This repository is a workspace for mechanical drivetrain design and calculate tasks (motor selection, transmission ratio, and operating parameters). It is organized into a backend API, a frontend UI, and layout prototypes for each workflow step.

## 1. Quick Overview

### Project goals
- Keep business logic (BE), UI (FE), and design/prototype assets (`layout`) clearly separated.
- Provide a foundation for an end-to-end engineering workflow from Step 1 to Step 5.

### High-level architecture

| Area | Stack | Responsibility |
|---|---|---|
| `BE/` | Node.js + Express | API and engineering calculate logic |
| `FE/` | React + Vite | Web user interface |
| `layout/stitch/` | HTML prototypes + design docs | UX flow drafts and visual direction |
| `DB/` | Placeholder | Future database integration |

## 2. Repository Map

```text
CNPM DADN/
├─ README.md
├─ package.json
├─ .gitignore
├─ BE/
│  ├─ app.js
│  ├─ server.js
│  ├─ controllers/
│  ├─ services/
│  ├─ routes/
│  ├─ models/
│  └─ utils/
├─ FE/
│  ├─ src/
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  └─ vite.config.js
├─ DB/
└─ layout/
   └─ stitch/
      ├─ blueprint_precision/
      ├─ project_dashboard/
      ├─ step_1_input_parameters/
      ├─ step_2_motor_selection/
      ├─ step_3_transmission_design/
      ├─ step_4_bearing_comparison/
      ├─ step_4_shaft_bearing_design/
      └─ step_5_validation_analysis/
```

## 3. Current Codebase Status

### Backend
- The practical entry point for local testing is `BE/app.js`.
- Active API route: `POST /api/motor/calculate`.
- `BE/server.js` and `BE/routes/calculateRoutes.js` are currently in a draft/refactor state and are not aligned with the active flow.
- Some model/utility files are still placeholders (`models/motor.model.js`, `models/project.model.js`, `utils/exportReport.js`).

### Frontend
- The frontend is still at the Vite/React starter stage (`FE/src/App.jsx`).
- Folders such as `components`, `pages`, `layouts`, `routes`, `services`, and `utils` are prepared but not implemented yet.

### Layout and Design
- `layout/stitch/` contains workflow prototypes (dashboard + Step 1 to Step 5).
- `layout/stitch/blueprint_precision/DESIGN.md` contains the design-system direction and UI rules.

## 4. Installation Guide (Important)

> `node_modules` must not be committed to git.
> After cloning this repo, every contributor must run `npm install`.

### Prerequisites
- Node.js: recommended `20+`
- npm: recommended `10+`

### Step 1 - Clone

```bash
git clone <repo-url>
cd "CNPM DADN"
```

### Step 2 - Install dependencies

Use either approach below.

1. Install package sets one by one:

```bash
npm install
cd BE && npm install
cd ../FE && npm install
```

2. Install from root using prefixes:

```bash
npm install
npm --prefix BE install
npm --prefix FE install
```

## 5. Run Locally

Open 2 terminals.

### Terminal 1 - Backend

```bash
cd BE
node app.js
```

Backend default URL: `http://localhost:3000`

### Terminal 2 - Frontend

```bash
cd FE
npm run dev
```

Frontend default URL: `http://localhost:5173`

## 6. Available API (Current)

### `POST /api/motor/calculate`

Endpoint:

```text
http://localhost:3000/api/motor/calculate
```

Sample request body:

```json
{
  "P_ct": 7.5,
  "n_ct": 145,
  "efficiencies": {
    "belt": 0.95,
    "gear": 0.97,
    "bearing": 0.99
  }
}
```

Notes:
- The service/controller calculate flow exists.
- The motor lookup model (`BE/models/motor.model.js`) is still empty and should implement `findSuitableMotor` for real lookup behavior.

## 7. .gitignore and node_modules Notes

Make sure `.gitignore` contains the following:

```gitignore
.env
node_modules/
```

What this means:
- `node_modules/` stays out of git history.
- New contributors must reinstall dependencies after cloning.
- If you get `Cannot find module ...`, follow this order:
  1. Confirm you are in the correct folder (`BE` or `FE`).
  2. Run `npm install` in that folder.
  3. Run the start command again (`node app.js` or `npm run dev`).

## 8. Suggested Next Improvements

- Add scripts in `BE/package.json`:
  - `"start": "node app.js"`
  - `"dev": "nodemon app.js"` (if using nodemon)
- Consolidate the duplicate/draft calculate route flow (`server.js` and `routes/calculateRoutes.js`).
- Connect FE to real API calls (for example with a dedicated `FE/services/api.js`).

---

If you just cloned the repo and want to run it quickly:

1. Install dependencies for root, `BE`, and `FE`.
2. Run backend: `cd BE && node app.js`.
3. Run frontend: `cd FE && npm run dev`.