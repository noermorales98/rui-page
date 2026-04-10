```markdown
# Design System Document: The Modern Oracle

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Modern Oracle."** This concept balances the timeless authority of an editorial archive with the expansive, fluid nature of modern digital intelligence. We are moving away from "web-standard" layouts toward a signature experience that feels curated, intentional, and wise.

To achieve this, the system rejects the "boxed-in" nature of the traditional web. Instead, we utilize **Intentional Asymmetry** and **Expansive Whitespace**. Elements should feel as if they are floating on a high-end paper stock, layered with the precision of a master typesetter. This is not just a personal brand; it is a digital sanctuary for wisdom.

---

## 2. Colors & Surface Philosophy

### The Tonal Palette
Our palette is rooted in the earth (Warm Cream, Terracotta, Sage) but elevated by the celestial (Deep Indigo, Wisdom Gold).

*   **Primary Background (`surface`):** `#fef9f1` — A warm, non-glare cream that mimics premium heavy-weight paper.
*   **Headlines/Primary (`primary_container`):** `#3b2f6e` — A deep, intellectual indigo used for authoritative messaging.
*   **The Accent (`secondary`):** `#7d5700` — Our "Wisdom Gold," used sparingly for highlights, call-outs, and moments of enlightenment.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or tonal transitions. To separate a section, transition from `surface` to `surface-container-low`. Use space, not lines, to create rhythm.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of vellum or stone.
*   **Lowest Tier:** `surface_container_lowest` (#ffffff) for floating cards that need maximum "pop."
*   **Base Tier:** `surface` (#fef9f1) for the primary canvas.
*   **High Tier:** `surface_container_high` (#ece8e0) for inset modules or sidebars that require a sense of "grounding."

### Glass & Gradients
To provide "visual soul," use subtle gradients transitioning from `primary` (#251857) to `primary_container` (#3b2f6e) for hero backgrounds. For floating navigation or over-image overlays, apply **Glassmorphism**: use `surface` at 70% opacity with a `20px` backdrop-blur to allow the richness of the background to bleed through.

---

## 3. Typography

The typographic system is a dialogue between the classic (Serif) and the functional (Sans-Serif).

*   **The Display Scale (Newsreader):** Used for "The Oracle’s" voice. The high-contrast serif provides an editorial, authoritative weight. 
    *   *Directives:* Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for hero headlines to create a "masthead" feel.
*   **The Body Scale (Inter):** Used for clarity and modernism. 
    *   *Directives:* Maintain a generous line-height (1.6) for `body-lg` to ensure the "Modern Oracle" feels expansive and easy to digest.
*   **The Signature Accent:** Use elegant italics (Cormorant Italic) for pull-quotes and marginalia. This adds a human, "hand-annotated" touch to the digital experience.

---

## 4. Elevation & Depth

### Tonal Layering
Depth is achieved by "stacking" the surface-container tokens. Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft lift. This mimics the way light hits physical paper.

### Ambient Shadows
Shadows are rarely used. When necessary for floating elements (like a "Book a Consultation" button), use **Ambient Shadows**:
*   **Color:** Tinted with `on_surface` (#1d1c17) at 4-6% opacity.
*   **Blur:** Extra-diffused (30px - 60px).
*   **Offset:** Vertical-only (Y: 8px) to imply a natural overhead light source.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use the `outline_variant` token at **20% opacity**. 100% opaque borders are strictly forbidden as they break the editorial fluidity.

---

## 5. Components

### Buttons
*   **Primary:** `primary_container` background with `on_primary` text. **Shape:** `xl` (0.75rem) or `full` for a sophisticated, pebble-like feel.
*   **Tertiary (Text-only):** Use `primary` text with a `secondary` (Gold) underline that is only 2px thick and offset by 4px.

### Cards & Lists
*   **Forbid Divider Lines.** Separate list items using `8px` of vertical whitespace and a very subtle hover state using `surface_container_low`.
*   **Editorial Cards:** Use `surface_container_low` with `xl` (0.75rem) roundedness. Headlines inside cards should always be `title-lg` (Serif).

### Input Fields
*   **Style:** Minimalist. No background fill. Only a "Ghost Border" bottom-line.
*   **Focus State:** The bottom line transitions to `secondary` (Gold) and the label (Inter) slides up and shrinks to `label-sm`.

### Abstract Iconography
Icons should not be literal. Use **Abstract Geometric Iconography**. A "Search" icon might be a perfect circle with a single diagonal line; "Growth" might be a series of escalating golden dots. Icons should feel like ancient runes updated for a digital age.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Align text to the left but allow images to bleed off-canvas to the right.
*   **Use High-Contrast Scaling:** Pair a massive `display-lg` headline with a tiny, uppercase `label-md` for sub-headers.
*   **Layer with Purpose:** Ensure every "layer" shift (e.g., a darker cream background) serves to group related thoughts.

### Don't:
*   **Don't use pure black.** Use Deep Indigo (`primary`) for high contrast.
*   **Don't use standard drop shadows.** They feel "cheap" and "SaaS-like." Stick to Tonal Layering.
*   **Don't crowd the content.** If a section feels full, add `32px` of additional padding. The "Oracle" needs room to breathe.
*   **Don't use 1px dividers.** They are the enemy of this system's premium, editorial feel. Use space.```