---
name: Clinical Precision
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c3c6d2'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8d919c'
  outline-variant: '#424750'
  surface-tint: '#a9c7ff'
  primary: '#a9c7ff'
  on-primary: '#003063'
  primary-container: '#2e5fa3'
  on-primary-container: '#c8daff'
  inverse-primary: '#2d5ea2'
  secondary: '#a2e7ff'
  on-secondary: '#003642'
  secondary-container: '#00d2fd'
  on-secondary-container: '#005669'
  tertiary: '#ffb3ae'
  on-tertiary: '#68000b'
  tertiary-container: '#bb1824'
  on-tertiary-container: '#ffcdc9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#074689'
  secondary-fixed: '#b4ebff'
  secondary-fixed-dim: '#3cd7ff'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930014'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  panel-width: 320px
---

## Brand & Style
The design system is engineered for high-stakes medical simulation and surgical training. The brand personality is **clinical, authoritative, and technologically advanced**, evoking the feeling of a modern operating theater's digital infrastructure. It targets medical professionals and students who require absolute clarity and zero distraction during immersive learning.

The design style is a hybrid of **Corporate Modern** and **Tactile Glassmorphism**. It utilizes high-contrast interfaces to ensure legibility under various lighting conditions, while employing subtle translucent overlays to mimic the "Heads-Up Display" (HUD) aesthetics found in robotic surgery consoles. The visual language emphasizes precision, reliability, and the gravity of medical practice.

## Colors
The palette is rooted in a deep, nocturnal foundation to minimize eye strain and maximize the "glow" of critical data.

*   **Primary (Medical Blue):** `#2E5FA3` - Used for primary actions, active states, and brand identification. It represents stability and professional trust.
*   **Secondary (Cyan Surge):** `#00D4FF` - Reserved for "live" data, active simulation pulses, and interactive HUD elements.
*   **Tertiary (Emergency Red):** `#FF4D4D` - Strictly for critical alerts, vital sign warnings, and destructive actions.
*   **Neutral (Deep Space):** `#0F172A` - The primary background color. It provides a high-contrast base for all text and overlays.

The color system uses high-contrast ratios (minimum 7:1 for text) to ensure that technical data is legible in fast-paced simulation environments.

## Typography
The typography system uses **Geist** as its primary typeface to achieve a clean, technical, and modern aesthetic. Its geometric precision mirrors the accuracy required in surgical procedures.

For data-heavy readouts, vital signs, and technical parameters, **JetBrains Mono** is utilized. The monospaced nature of this font ensures that numerical data remains stable and aligned, preventing visual "jumping" when values fluctuate rapidly during a simulation.

Hierarchy is strictly enforced through weight and letter spacing. Labels are often set in uppercase with increased tracking to differentiate "metadata" from "content."

## Layout & Spacing
The layout follows a **Fixed Grid** model for simulation controls and a **Fluid Grid** for the primary 3D viewport or viewport data. 

*   **Grid System:** A 12-column grid is used for dashboard views.
*   **The HUD Model:** Simulation-specific controls are housed in fixed-width side panels (`320px`) to ensure that the primary visual field (the "patient") remains centered and unobstructed.
*   **Spacing Rhythm:** An 8px base unit governs all padding and margins. Large gutters (`24px`) are used to prevent accidental taps in high-pressure interaction scenarios.

On mobile devices, the layout collapses into a single-column scroll for debriefing, while the active simulation mode rotates to a landscape-locked orientation with condensed "thumb-trigger" margins.

## Elevation & Depth
Depth in this design system is conveyed through **Tonal Layering** and **Glassmorphism**, rather than traditional shadows.

1.  **Base Layer:** The deepest level, using the neutral `#0F172A`.
2.  **Surface Layer:** A slightly lighter shade (`#1E293B`) used for cards and grouped content.
3.  **Overlay Layer (HUD):** Semi-transparent surfaces (20% opacity) with a `24px` backdrop blur. These "float" over the 3D simulation space to provide real-time data without obscuring the surgical field.
4.  **Interaction Glow:** Instead of shadows, active elements emit a subtle outer glow using the Primary or Secondary colors (e.g., `box-shadow: 0 0 15px rgba(46, 95, 163, 0.4)`).

## Shapes
The shape language is **Soft (0.25rem / 4px base)**. This subtle rounding provides a sophisticated, professional feel that balances clinical coldness with modern ergonomics.

*   **Action Elements:** Buttons and input fields use the base `4px` radius.
*   **Containment:** Large data panels and cards use `8px` (`rounded-lg`) to create clear containment of complex medical information.
*   **Status Indicators:** Small status dots and active-state pips are fully circular to stand out against the geometric grid.

## Components
### Buttons
Buttons are high-contrast. Primary buttons use the Medical Blue background with white text. Ghost buttons use a `1px` border of the primary color. In simulation mode, buttons include a "pressed" state that increases the inner glow to provide tactile visual feedback.

### Input Fields
Inputs are dark-themed with a subtle `1px` border. Upon focus, the border transitions to Cyan Surge with a soft glow. Error states utilize the Emergency Red for both the border and the helper text.

### Cards & Panels
Cards use the "Surface Layer" background. For "Vital Sign" cards, the background is replaced with a low-opacity glass effect when overlaid on video or 3D feeds.

### Chips & Status Tags
Used for categorizing equipment or surgical steps. They use a "ghost" style (outline only) unless they represent an active "On" state, in which case they are filled with the Secondary color.

### Progress Bars & Gauges
Critical for surgical training. These utilize the Secondary color for "Normal" ranges and transition to Tertiary (Red) as they approach critical thresholds. The motion of these elements should be linear and precise, with no easing to reflect real-time data accuracy.