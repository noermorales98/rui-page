```markdown
# Design System Document: Ángeles Terrenales

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Oracle"**

This design system moves away from the clinical coldness of standard SaaS and the heavy literalism of traditional spiritualism. Instead, it adopts a "High-End Editorial" aesthetic. It treats the digital interface as a curated journey—a series of intentional, layered spaces that feel as tactile as a premium art book. 

The goal is to facilitate "Expansion" through **Atmospheric Depth**. We break the "template" look by utilizing intentional asymmetry, expansive negative space (breathing room), and a hierarchy that prioritizes wisdom (Serif Headlines) over mere utility. The interface should feel like it is exhaling.

---

## 2. Color & Tonal Architecture
The palette is rooted in the earth but elevated by the ethereal. We utilize a Material 3-based tonal system to ensure depth without visual noise.

### Palette Strategy
- **Primary (`#251857`) & Primary Container (`#3B2F6E`):** Used for headlines and core brand moments to anchor the experience in wisdom and depth.
- **Secondary (`#7D5700`) & Secondary Container (`#FDC664`):** Our "Gold" accent. Use sparingly for high-value calls to action or moments of "enlightenment" within the journey.
- **Tertiary Trio (Contextual Storytelling):**
    - **Sage Green (`#6B9E82` / `tertiary_fixed_dim`):** Reserved for "Inner Child" content.
    - **Terracotta (`#C4704F` / `on_error_container` variant):** Reserved for "Fallen Angels" themes.
    - **Slate Blue (`#5B7FA6` / `on_primary_container` variant):** Reserved for "Ancestral/Earthly" themes.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. 
Boundaries must be defined solely through background color shifts. To separate a section, transition from `surface` (`#fef9f1`) to `surface_container_low` (`#f8f3eb`). This creates a "soft-edge" transition that feels sophisticated rather than structural.

### Glass & Gradient Soul
To move beyond a flat UI, use **Glassmorphism** for floating cards (e.g., navigation bars or modal overlays). 
- **Recipe:** `surface` color at 70% opacity + `backdrop-blur: 20px`.
- **Signature Gradient:** For Hero backgrounds or Primary CTAs, use a subtle radial gradient from `primary` (`#251857`) to `primary_container` (`#3B2F6E`) to give the deep indigo a sense of "inner light."

---

## 3. Typography: The Voice of Wisdom
The contrast between the Serif and Sans-Serif reflects the brand's balance of ancient wisdom and modern accessibility.

| Token | Typeface | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display-LG** | Playfair Display | 3.5rem | 700 | Earth-shaking transformative statements. |
| **Headline-MD** | Playfair Display | 1.75rem | 600 | Wisdom-led section titles. |
| **Title-LG** | Inter | 1.375rem | 500 | Modern, clear subtitles/action headers. |
| **Body-LG** | Inter | 1.0rem | 400 | Primary reading experience; high line-height (1.6). |
| **Label-MD** | Inter | 0.75rem | 600 | Functional metadata; All-caps with 0.05em tracking. |

**Editorial Rule:** Use `display-lg` in asymmetrical layouts. Offset large text so it overlaps background shapes or image edges to create a "custom-designed" feel.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**.

*   **The Layering Principle:** Treat the UI as stacked sheets of fine paper. 
    *   Base: `surface`
    *   Section: `surface_container_low`
    *   Floating Card: `surface_container_lowest` (White)
*   **Ambient Shadows:** If a shadow is required for a floating action button, use a "Tinted Glow": 
    *   `box-shadow: 0 20px 40px rgba(59, 47, 110, 0.08);` (A soft indigo tint instead of black).
*   **The "Ghost Border":** For input fields or cards needing definition on very similar backgrounds, use `outline_variant` at **15% opacity**. Never 100%.

---

## 5. Components

### Buttons: The Vessels of Action
*   **Primary:** `primary` background with `on_primary` text. Shape: `xl` (1.5rem) roundedness. No shadow; use a subtle `primary_container` glow on hover.
*   **Secondary (Gold):** `secondary_container` background. Use for "Transformation" moments.
*   **Tertiary:** Ghost style. No background. `primary` text with a `surface_container_high` background shift on hover.

### Cards: The Knowledge Containers
*   **Rule:** Forbid divider lines.
*   **Structure:** Use `xl` (1.5rem) corner radius. Content is separated by `1.5rem` to `2rem` of vertical whitespace. 
*   **Interaction:** On hover, a card should not "lift" with a shadow; it should subtly shift in color from `surface_container_low` to `surface_container_high`.

### Input Fields: The Intimate Dialogue
*   **Style:** Minimalist. Only a bottom border (Ghost Border style) that expands to a full `secondary` (Gold) underline on focus.
*   **Typography:** Floating labels using `label-md`.

### Featured Suggestion: "The Expansion Reveal"
A custom component for this system: An accordion-style element that uses a soft gradient expansion. When a user clicks to learn more, the content doesn't just "push" down; it fades in with a `backdrop-blur` transition, making the expansion feel mental rather than mechanical.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If the left margin is 10%, try a right margin of 15% for editorial hero sections.
*   **Do** use abstract geometric shapes (circles, arcs) in `tertiary_fixed_dim` at 5% opacity in the background to imply "energy fields."
*   **Do** ensure all imagery uses a "Warm Film" grain filter to match the `#F7F2EA` background.

### Don't
*   **Don't** use pure black `#000000`. Use `primary` or `on_background` for depth.
*   **Don't** use sharp 90-degree corners. Everything must feel "held" and approachable (minimum `sm` roundedness).
*   **Don't** use literal religious iconography (crosses, lotuses). Use light effects, refractions, and circular geometry to imply spirituality.
*   **Don't** crowd the screen. If you feel you need a divider, you actually need more whitespace.

---

## 7. Accessibility & Motion
*   **Contrast:** All `body-md` text must maintain a 4.5:1 ratio against surface colors.
*   **Motion:** Use "Ease-in-out-quart" for all transitions. Movements should feel slow, intentional, and "underwater"—never snappy or jarring. When a card appears, it should drift upward 20px while fading in.