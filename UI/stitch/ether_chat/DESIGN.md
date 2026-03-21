# Design System Specification: The Fluid Dialogue

## 1. Overview & Creative North Star
**Creative North Star: "The Weightless Canvas"**
This design system moves beyond the rigid, boxy constraints of traditional chat applications. Instead of a "grid of containers," we treat the interface as a singular, breathable ecosystem. By leveraging high-end editorial layouts, we prioritize "White Space as Structure." The goal is to create a signature experience that feels as intuitive and effortless as a physical conversation—achieved through intentional asymmetry, sophisticated tonal layering, and the complete elimination of harsh structural lines.

---

## 2. Color & Surface Architecture
We move away from the "bordered box" aesthetic. Contrast and hierarchy are defined through depth and light, not outlines.

### Surface Hierarchy & Nesting
To create a premium, tactile feel, use the `surface-container` tiers to represent physical height.
- **Base Layer:** `surface` (#f6f6fb) — The infinite canvas.
- **Secondary Workspace:** `surface-container-low` (#f0f0f6) — Used for sidebars or secondary navigation.
- **Active Components:** `surface-container-lowest` (#ffffff) — Used for message bubbles or active cards to create a "lifted" appearance.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to separate the sidebar from the chat thread. Use a shift from `surface-container-low` to `surface`. Boundaries are felt, not seen.

### The "Glass & Gradient" Rule
For floating elements (like a "Jump to Latest" button), use Glassmorphism:
- **Background:** `surface-container-lowest` at 80% opacity.
- **Backdrop-blur:** 12px.
- **CTAs:** Apply a subtle linear gradient from `primary` (#0058bb) to `primary_container` (#6c9fff) at a 135° angle to give action elements a "jewel-like" depth.

---

## 3. Typography: Editorial Precision
We use **Inter** as our typographic backbone. The system relies on a high-contrast scale to guide the eye without needing icons or bold colors for every label.

*   **Display (The Statement):** Use `display-sm` (2.25rem) for empty state headers or welcome screens. Tighten letter-spacing to -0.02em for a premium feel.
*   **Headlines (The Context):** `headline-sm` (1.5rem) with `on_surface` (#2d2f33) for main chat names.
*   **Body (The Dialogue):** `body-lg` (1rem) for the chat bubbles. Increase line-height to 1.5 for maximum legibility during long reads.
*   **Labels (The Metadata):** `label-sm` (0.6875rem) using `on_surface_variant` (#5a5b60) for timestamps. These should be all-caps with +0.05em tracking to differentiate from message content.

---

## 4. Elevation & Depth
Depth is a functional tool, not a stylistic flourish. We utilize **Tonal Layering** over shadows.

*   **The Layering Principle:** Place a message bubble (`surface-container-lowest`) on top of the chat background (`surface`). The delta in luminance creates a natural edge.
*   **Ambient Shadows:** For high-priority modals, use a "Cloud Shadow":
    *   `Y: 8px, Blur: 32px, Spread: 0`
    *   **Color:** `on_surface` at 4% opacity. This mimics natural light rather than digital "glow."
*   **The Ghost Border:** If a divider is required for accessibility (e.g., in Dark Mode), use `outline_variant` (#acadb1) at **10% opacity**. Never use a high-contrast 100% opaque border.

---

## 5. Components

### Message Bubbles
*   **Received:** `surface-container-highest` (#dbdde3). Shape: `md` (0.75rem) on all corners, except the bottom-left which is `sm` (0.25rem).
*   **Sent:** Gradient from `primary` to `primary_dim`. Shape: `md` (0.75rem) on all corners, except the bottom-right which is `sm`.
*   **Spacing:** Use `spacing-4` (1rem) between distinct message clusters; `spacing-1` (0.25rem) between messages from the same sender.

### Input Fields (The Composer)
*   **Container:** `surface_container_lowest` (#ffffff).
*   **Shape:** `xl` (1.5rem) for a pill-shaped, approachable feel.
*   **State:** On focus, transition the "Ghost Border" from 10% to 30% opacity using the `primary` color.

### Avatars & Indicators
*   **Shape:** `full` (9999px).
*   **Status Indicator:** Use `tertiary` (#006a26) for "Online." It must have a 2px "gap" (using the background color) to separate the indicator from the avatar image.

### Search Bars
*   **Visual Style:** No border. Use `surface_container` (#e7e8ee). 
*   **Iconography:** Lucide-style icons at 20px size, using `outline` (#75777b) color.

---

## 6. Dark Mode Specifications
In Dark Mode, we swap the luminance but maintain the "No-Line" philosophy.
*   **Background:** `inverse_surface` (#0c0e12).
*   **Primary Surfaces:** `surface_container_low` (mapped to a deep charcoal).
*   **Accent:** Use `inverse_primary` (#4b8eff) for better legibility against dark backgrounds.
*   **Depth:** Use "Inner Glows" (1px inner shadow, 10% white) on top of cards to simulate light hitting the top edge of a physical surface.

---

## 7. Do’s and Don’ts

### Do
*   **Do** use vertical whitespace (`spacing-8` or `spacing-10`) to separate conversation dates instead of horizontal lines.
*   **Do** use asymmetrical layouts in the sidebar—labels for "Direct Messages" should be offset to the left of the avatars.
*   **Do** prioritize `surface-tint` transitions for hover states to keep the experience "alive."

### Don't
*   **Don't** use a divider line between list items in the contact list. Use a slight background change (`surface-container-high`) on hover instead.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#2d2f33) to maintain a soft, premium editorial feel.
*   **Don't** use sharp corners. Every interaction point must use at least the `sm` (0.25rem) or `md` (0.75rem) rounding scale.