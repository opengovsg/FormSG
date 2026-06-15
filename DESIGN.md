---
name: FormSG
description: Singapore's government form builder, friendly and clear
colors:
  primary: "#4A61C0"
  primary-light: "#F6F7FC"
  primary-mid: "#E4E7F6"
  primary-deep: "#2C3A73"
  secondary: "#445072"
  secondary-light: "#F5F6F8"
  secondary-deep: "#293044"
  neutral-bg: "#FBFCFD"
  neutral-border: "#C9CCCF"
  neutral-text: "#636467"
  neutral-dark: "#242425"
  danger: "#C05050"
  danger-light: "#FFF8F8"
  warning: "#F9D867"
  warning-light: "#FFFCF2"
  success: "#05CC9A"
  success-deep: "#038564"
  success-light: "#E6FCF7"
  content-strong: "#2E2E2E"
  content-default: "#474747"
  content-medium: "#848484"
typography:
  display:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: "4.5rem"
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.019em"
  title:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "-0.014em"
  body:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "-0.011em"
  label:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
    letterSpacing: "-0.006em"
  caption:
    fontFamily: "'Inter var', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0"
rounded:
  sm: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "9px 15px"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "#3B4E9A"
  button-primary-active:
    backgroundColor: "{colors.primary-deep}"
  button-outline:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "9px 15px"
  input-default:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.content-default}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.75rem"
  card-surface:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "1.5rem"
---

# Design System: FormSG

## 1. Overview

**Creative North Star: "The Helpful Desk Officer"**

The colleague who knows every government process inside out and walks you through it without making you feel lost. Not a cold kiosk. Not a chatbot. A real person at a real desk who happens to know exactly what form you need, which fields matter, and what happens next.

FormSG's design system serves this metaphor at every level. Interfaces are warm but competent. They guide without hand-holding. They speak in plain language, celebrate completion without fanfare, and never make the user feel like they need training. The system earns trust through consistency: same patterns, same vocabulary, same behavior on every screen.

What this system explicitly rejects: the gray density of enterprise tools like Salesforce, the gratuitous animation of over-designed SaaS, and the dated patterns of generic government portals. FormSG represents what modern government digital services look like when they put the user first.

**Key Characteristics:**
- Single font family (Inter) across all surfaces for unified, professional voice
- Restrained color palette with primary blue as the sole accent, used sparingly
- Tonal layering for depth instead of heavy shadows
- 4px radius everywhere for gentle consistency
- Warm, guiding component feel with clear state feedback
- Progressive disclosure over locked gates

## 2. Colors

A restrained civic palette. Primary blue carries all action and emphasis. Everything else is neutral territory with semantic colors reserved strictly for system states.

### Primary
- **Civic Blue** (#4A61C0): Primary actions, current selection, links, focus indicators. The single accent color. Used on no more than 10% of any screen.
- **Civic Blue Light** (#F6F7FC): Tinted background for selected states, subtle highlights, and the admin form canvas.
- **Civic Blue Mid** (#E4E7F6): Hover backgrounds, secondary highlights.
- **Civic Blue Deep** (#2C3A73): Active/pressed states, text on light blue backgrounds.

### Secondary
- **Slate** (#445072): Secondary text, labels, descriptions. The workhorse text color for anything that isn't primary content.
- **Slate Light** (#F5F6F8): Subtle panel backgrounds, sidebar tints.
- **Slate Deep** (#293044): High-emphasis secondary text.

### Neutral
- **Paper** (#FBFCFD): Page background. Nearly white with the faintest cool tint.
- **Border** (#C9CCCF): Default borders, dividers. Visible but not competing.
- **Muted Text** (#636467): Placeholder text, disabled labels, tertiary content.
- **Ink** (#242425): Highest-contrast text. Used sparingly for display headings.
- **Content Strong** (#2E2E2E): Primary body text.
- **Content Default** (#474747): Standard body text.
- **Content Medium** (#848484): De-emphasized text, timestamps, metadata.

### Semantic
- **Danger** (#C05050) / **Danger Light** (#FFF8F8): Errors, destructive actions, validation failures.
- **Warning** (#F9D867) / **Warning Light** (#FFFCF2): Cautions, incomplete states.
- **Success** (#05CC9A) / **Success Deep** (#038564) / **Success Light** (#E6FCF7): Confirmations, completed states, positive feedback.

**The One Accent Rule.** Civic Blue is the only accent color. It marks primary actions and current state. Every other color is neutral or semantic. If blue appears on more than 10% of a screen, something is over-decorated.

## 3. Typography

**Body Font:** Inter var (with system sans-serif fallback)

**Character:** One family, many weights. Inter handles everything from 64px display headlines to 10px legal text. The system leans on weight and size contrast, not font pairing. Tabular numerals (`tnum`) and the `cv05` character variant are enabled globally for clean number alignment and consistent letterforms.

### Hierarchy
- **Display** (700, 4rem/64px, line-height 4.5rem): Landing page heroes only. Mobile drops to 2.5rem/40px.
- **Headline** (600, 1.5rem/24px, line-height 2rem): Section headings, page titles. The workhorse heading level.
- **Title** (500, 1.125rem/18px, line-height 1.5rem): Card titles, subsection labels, dialog headers.
- **Body** (400, 1rem/16px, line-height 1.5rem): All running text. Max line length 65-75ch for readability.
- **Label** (500, 0.875rem/14px, line-height 1.25rem): Form labels, navigation items, secondary headings.
- **Caption** (500, 0.75rem/12px, line-height 1rem): Timestamps, helper text, badges.

**The Tight Tracking Rule.** Every text style carries negative letter-spacing (from -0.006em to -0.022em). This is intentional, not default. Inter at these sizes benefits from slightly tighter tracking. Never override to `normal` or `0` without checking the result at the target size.

## 4. Elevation

FormSG uses tonal layering as its primary depth strategy. Surfaces communicate hierarchy through background color shifts, not shadow weight. White content areas sit on `neutral.100` (#FBFCFD) or `primary.100` (#F6F7FC) backgrounds. Panels use `secondary.100` or `neutral.200` to recede.

Shadows exist but are reserved for floating layers only.

### Shadow Vocabulary
- **Ambient** (`0px 0px 10px rgba(216, 222, 235, 0.5)`): Gentle lift for cards on hover. Cool-toned to match the primary palette.
- **Float** (`0px 0px 20px rgba(97, 108, 137, 0.3)`): Dropdowns, popovers, tooltips. Anything that floats above the page.
- **Overlay** (`0px 0px 50px rgba(97, 108, 137, 0.4)`): Modals and dialogs. Combined with a 65% black backdrop overlay.

**The Tonal Depth Rule.** Depth comes from background color, not shadow. A sidebar is `secondary.100`, not white-with-shadow. A selected card is `primary.100`, not white-with-border. Shadows appear only when something genuinely floats above the page plane.

## 5. Components

Warm and guiding. Every component should feel like the Helpful Desk Officer placed it there for a reason. States are clear, transitions are gentle, and the vocabulary is consistent across every screen.

### Buttons
- **Shape:** Gently squared (4px radius). Never fully rounded, never sharp.
- **Primary:** Civic Blue (#4A61C0) fill, white text. 44px min-height (touch-friendly). Padding 9px 15px.
- **Hover:** Darkens to #3B4E9A. No motion, just color shift.
- **Focus:** 4px blue ring (`0 0 0 4px primary.300`). Always visible on keyboard nav.
- **Outline/Reverse:** White fill, Civic Blue border and text. For secondary actions.
- **Clear:** Transparent, Civic Blue text. For tertiary/cancel actions.
- **Disabled:** Reduced opacity. Never change the color to gray; keep the variant recognizable.

### Inputs / Fields
- **Style:** 1px `neutral.400` border, white fill, 4px radius. 44px height. 16px horizontal padding.
- **Focus:** Border shifts to `primary.500`, plus 1px focus ring in same color.
- **Error:** Border shifts to `danger.500`. Error message appears below in danger color.
- **Success:** Border shifts to `success.700`. Used for validated fields.
- **Disabled:** `neutral.200` background fill. Cursor not-allowed.
- **Placeholder:** `neutral.500` text. Must meet 4.5:1 contrast.

### Cards / Containers
- **Corner Style:** 4px radius universally.
- **Background:** White on tinted backgrounds (`neutral.100` or `primary.100`). Tinted on white backgrounds.
- **Shadow Strategy:** No shadow at rest. Ambient shadow on hover when the card is interactive.
- **Border:** 1px `neutral.300` when distinction from background is needed. No border when tonal contrast is sufficient.
- **Internal Padding:** 24px (1.5rem) standard. 16px on mobile.

### Navigation
- **Admin sidebar:** Icon + label, vertical stack. Active state uses `primary.100` background with `primary.500` text.
- **Tabs:** Horizontal, underline-style active indicator in `primary.500`.
- **Breadcrumbs:** `label` size text, slash-separated, linked.

### Workflow Step Blocks (Signature Component)
The multi-step workflow builder is FormSG's most complex UI surface. Steps are vertical cards connected by dividers with chevron icons. Active steps have white backgrounds with `primary.500` left borders. Inactive steps are condensed read-only summaries. The guided creation mode uses progressive disclosure with fade-in animations (250ms) between sections.

## 6. Do's and Don'ts

### Do:
- **Do** use Civic Blue (#4A61C0) exclusively for primary actions and current state. Its rarity is the signal.
- **Do** use tonal layering (background color shifts) for depth. White on `neutral.100`, `primary.100` for selected states.
- **Do** maintain 44px minimum touch targets on all interactive elements.
- **Do** use the same 4px radius on every component. Consistency builds trust.
- **Do** write labels in plain language. If a government officer wouldn't say it out loud, rewrite it.
- **Do** provide clear error messages that tell the user what to fix, not what went wrong technically.
- **Do** use semantic colors strictly for system states (danger for errors, success for confirmation, warning for caution).

### Don't:
- **Don't** use shadows for depth on surfaces at rest. Shadows are for floating layers only (modals, dropdowns, popovers).
- **Don't** make it look like Salesforce or ServiceNow. No gray density, no information overload, no training-required interfaces.
- **Don't** add gratuitous animations, gradient buttons, or startup-cute illustrations. Every motion earns its place through function.
- **Don't** reproduce generic government portal patterns. No dated layouts, no bureaucratic visual language.
- **Don't** use Civic Blue decoratively (backgrounds, borders, illustrations). It's reserved for action and state.
- **Don't** use display fonts in UI labels, buttons, or data. Inter handles everything.
- **Don't** add side-stripe borders (border-left > 1px as colored accent). Use full borders, background tints, or icons.
- **Don't** introduce a second accent color. One accent, one voice.
- **Don't** use different component vocabularies across screens. Same button shape, same input style, same radius. Everywhere.
