# Engineering Design System: Editorial Precision

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**

This design system moves beyond the generic "SaaS Dashboard" by treating software as a high-end engineering instrument. It draws inspiration from the spatial clarity of Apple UI, the functional density of Linear, and the typographic breathing room of Notion. 

The goal is to eliminate "UI noise." We reject the standard box-and-line layout in favor of **Tonal Layering** and **Intentional Asymmetry**. By utilizing white space as a structural element rather than a void, we create a high-density environment that feels calm, authoritative, and premium. The interface should feel like a series of meticulously stacked sheets of technical vellum—physical, precise, and sophisticated.

---

## 2. Colors & Surface Logic

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. High-end design is felt through transitions, not outlines. Define boundaries strictly through background shifts:
*   **Surface:** The base canvas (`#f8f9fa`).
*   **Surface-Container-Low:** Use for sidebars or secondary navigation to create a "recessed" feel.
*   **Surface-Container-Lowest:** Use for primary content cards (`#ffffff`) to create a "lifted" appearance without a shadow.

### Surface Hierarchy & Nesting
Instead of flat grids, use the `surface-container` tiers to define importance. An inner module should always be one tier higher or lower than its parent to establish a natural, physical hierarchy.
*   **Primary Action Area:** `surface_container_lowest` (#ffffff)
*   **Secondary Context:** `surface_container` (#edeeef)
*   **Background Foundation:** `surface` (#f8f9fa)

### The "Glass & Gradient" Rule
To elevate the "Engineering" aesthetic, use Glassmorphism for floating elements (Command Palettes, Popovers). 
*   **Token:** `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur.
*   **Signature Texture:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` (#0058be) to `primary_container` (#2170e4) at a 135° angle to provide a "machined" depth.

---

### Color Palette (Tokens)
| Role | Hex | Usage |
| :--- | :--- | :--- |
| **Primary** | `#0058be` | Brand actions, active states. |
| **Secondary** | `#495e8a` | Supportive metadata, secondary toggle states. |
| **Tertiary** | `#924700` | Warning/Caution indicators (Engineering focus). |
| **Error** | `#ba1a1a` | Critical validation, system failure. |
| **On-Surface** | `#191c1d` | Primary text and high-contrast iconography. |
| **Outline-Variant** | `#c2c6d6` | Use only for "Ghost Borders" at 10-20% opacity. |

---

## 3. Typography: The Editorial Scale

We use **Inter** exclusively. It is a typeface designed for screens, providing the legibility required for complex engineering data while maintaining a clean, modern silhouette.

*   **Display (lg/md):** Used for high-impact data visualizations or landing hero states. 
*   **Headline (sm/md):** Used for workflow titles. Set with tight letter-spacing (`-0.02em`) to feel "locked-in."
*   **Title (sm):** The workhorse for module headers. High-contrast against `on_surface_variant`.
*   **Body (md):** Default for all technical descriptions. Use a generous line-height (`1.5`) to prevent data fatigue.
*   **Label (sm):** Used for micro-copy and status tags. Always `Uppercase` with `0.05em` letter-spacing for a "technical spec" feel.

---

## 4. Elevation & Depth: Tonal Layering

### The Layering Principle
Depth is achieved through "stacking" rather than "lifting."
*   **Level 0:** `surface` (The floor)
*   **Level 1:** `surface_container_low` (Navigation/Sidebars)
*   **Level 2:** `surface_container_lowest` (Workable cards/Content)

### Ambient Shadows
When a component must float (e.g., a modal or dropdown), use **Ambient Shadows**:
*   **Blur:** `32px` to `64px`
*   **Opacity:** 4% to 8%
*   **Color:** Tint the shadow with `on_surface` (#191c1d) to ensure it feels like a natural shadow cast on the specific background.

### The "Ghost Border"
If accessibility requires a container boundary, use the `outline_variant` token at **15% opacity**. This creates a "suggestion" of a line that disappears into the background, maintaining the minimalist "No-Line" philosophy.

---

## 5. Components

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary_container`), `md` (12px) roundedness. No border.
*   **Secondary:** `surface_container_high` background with `on_surface` text.
*   **States:** On hover, increase the gradient saturation; on press, scale the component to `0.98`.

### Engineering Chips & Status
*   **Status Indicators:** Forbid the "solid pill." Use a `surface_container_highest` background with a small, 6px solid dot using the status color (Success, Error, Primary).
*   **Typography:** Use `label-sm` for all chip text to maintain high-density clarity.

### Input Fields & Workflows
*   **The "Active Focus" State:** Inputs use `surface_container_lowest`. On focus, do not use a heavy border; use a `2px` glow using the `primary` color at 30% opacity.
*   **Validation:** Error states should change the `label` color to `error` and provide a `surface_container_error` subtle background tint to the entire input group.

### Cards & Lists (The Divider Rule)
**Strictly forbid divider lines.** 
*   To separate list items, use vertical spacing from the scale (e.g., `spacing-3` or `spacing-4`).
*   In high-density tables, use alternating row tints using `surface_container_low` at 40% opacity rather than horizontal rules.

### Step-by-Step Workflows
*   Use a "Progress Thread" approach: A vertical `2px` line using `outline_variant` at 20% opacity connecting workflow nodes, creating a sense of linear engineering logic.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `12px (md)` or `16px (lg)` corner radius for all main containers to soften the technical data.
*   **Do** prioritize `label-sm` for metadata—engineering software thrives on legible micro-copy.
*   **Do** use `primary_container` backgrounds for "Active Selection" in sidebars to create a soft, blue-tinted focus.

### Don't
*   **Don't** use pure black `#000000` for text; it creates too much vibration. Always use `on_surface` (#191c1d).
*   **Don't** use 100% opaque borders to separate sections. If you feel you need a line, use a background color shift instead.
*   **Don't** crowd the edges. If an element is within a card, use at least `spacing-5` (1.1rem) of internal padding to maintain the "Premium" feel.