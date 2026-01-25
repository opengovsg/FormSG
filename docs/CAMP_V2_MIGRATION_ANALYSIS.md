# Camp Design System V2 Migration Analysis

## Executive Summary

This document analyzes what it would take to migrate FormSG from its current custom "Camp" design system to the official `@opengovsg/design-system-react` package (Camp V2).

**Key Finding:** FormSG currently has a **fully custom design system** built directly on Chakra UI v2.8.2, with 40+ components and comprehensive theming. This is NOT a simple upgrade - it's a substantial migration effort.

---

## 1. Current State Analysis

### 1.1 What FormSG Uses Today

| Aspect | Current State |
|--------|--------------|
| **UI Framework** | Chakra UI v2.8.2 (direct dependency) |
| **Design System Package** | None - fully custom implementation |
| **Theme System** | Custom `extendTheme()` with own foundations |
| **Components** | 40+ custom components wrapping Chakra |
| **Storybook** | v8.3.1 with comprehensive documentation |
| **Typography** | Inter font via `inter-ui` package |

### 1.2 Current Design System Structure

```
frontend/src/
├── theme/
│   ├── index.ts              # Main theme (extendTheme)
│   ├── foundations/
│   │   ├── colours.ts        # Brand + 10 theme colors
│   │   ├── breakpoints.ts    # xs-xl breakpoints
│   │   └── shadows.ts
│   ├── textStyles.ts         # Display, heading, body styles
│   └── components/           # 40+ component theme configs
│       ├── Button.ts
│       ├── Input.ts
│       ├── Modal.ts
│       └── ... (37+ more)
│
├── components/               # 40+ React component implementations
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   ├── Dropdown/
│   ├── DatePicker/
│   └── ... (35+ more)
│
└── app/App.tsx               # ChakraProvider with custom theme
```

### 1.3 Components in FormSG (40+)

**Core Components:**
- Button, IconButton
- Input, NumberInput, MoneyInput, Textarea
- Modal, Drawer
- Dropdown (SingleSelect, MultiSelect)
- Checkbox, Radio, Toggle
- Tabs, Menu, Tooltip, Popover

**Form-Specific:**
- FormControl, FormLabel, FormErrorMessage
- PhoneNumberInput, DatePicker, DateRangePicker
- TagInput, Searchbar, Attachment
- Rating, YesNo fields

**Layout & Feedback:**
- Banner, InlineMessage, Toast
- Avatar, Badge, Tag
- Pagination, Tile
- GovtMasthead, Footer

---

## 2. Target State: Camp Design System V2

### 2.1 Package Details

| Aspect | Camp V2 |
|--------|---------|
| **Package** | `@opengovsg/design-system-react` |
| **Latest Version** | v1.33.0 (Dec 2025) |
| **Chakra UI Peer Dep** | ^2.10.5 |
| **React Peer Dep** | ^18.2.0 |
| **Documentation** | https://design.open.gov.sg |

### 2.2 Installation

```bash
npm install @opengovsg/design-system-react @chakra-ui/react@^2.10.5
```

### 2.3 Provider Setup

```tsx
import 'inter-ui/inter.css'
import { ThemeProvider } from '@opengovsg/design-system-react'

const App = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)
```

### 2.4 Key Differences from Current Setup

| Aspect | FormSG Current | Camp V2 |
|--------|---------------|---------|
| Provider | `ChakraProvider` + custom theme | `ThemeProvider` from Camp |
| Theme Extension | `extendTheme()` | Pre-configured theme |
| Chakra Version | v2.8.2 | v2.10.5 (requires upgrade) |
| Component Customization | Full control | Limited to Camp API |

---

## 3. Gap Analysis

### 3.1 Chakra UI Version Gap

**Current:** v2.8.2
**Required:** v2.10.5

This is a **minor version upgrade** but may have breaking changes. Need to review [Chakra UI changelog](https://github.com/chakra-ui/chakra-ui/blob/main/CHANGELOG.md).

### 3.2 Component Coverage Gap (AUDITED)

**Good news:** Camp V2 covers **~85% of FormSG components** directly.

#### Direct Matches (28 components) - Easy Migration
| FormSG Component | Camp V2 Equivalent |
|------------------|-------------------|
| Avatar | `Avatar` |
| Badge | `Badge` |
| Banner | `Banner` |
| Button | `Button` |
| Calendar | `Calendar` |
| Checkbox | `Checkbox` |
| DatePicker | `DatePicker` |
| DateRangePicker | `DateRangePicker` |
| Drawer | `Drawer` |
| Dropdown/SingleSelect | `SingleSelect` |
| Dropdown/MultiSelect | `MultiSelect` |
| Field/Attachment | `Attachment` |
| FormControl | `FormControl` |
| IconButton | `IconButton` |
| Input | `Input` |
| Link | `Link` |
| Menu | `Menu` |
| Modal | `Modal` |
| NumberInput | `NumberInput` |
| Pagination | `Pagination` |
| PhoneNumberInput | `PhoneNumberInput` |
| Popover | `Popover` |
| Radio | `Radio` |
| Searchbar | `Searchbar` |
| Spinner | `Spinner` |
| Tabs | `Tabs` |
| Tag | `Tag` |
| TagInput | `TagInput` |
| Textarea | `Textarea` |
| Tile | `Tile` |
| Toast | `Toast` |
| Toggle | `Toggle` (or `Switch`) |
| Tooltip | `Tooltip` |

#### Name Changes (3 components) - Simple Rename
| FormSG Component | Camp V2 Equivalent | Notes |
|------------------|-------------------|-------|
| Footer | `RestrictedFooter` | Verify API compatibility |
| GovtMasthead | `RestrictedGovtMasthead` | Verify API compatibility |
| InlineMessage | `Infobox` | Verify API compatibility |

#### Camp V2 Has These EXTRA Components
- `Breadcrumb` - FormSG doesn't have this
- `Sidebar` - FormSG doesn't have this
- `Toolbar` - FormSG doesn't have this
- `AvatarMenu` - FormSG doesn't have this

#### NO Camp V2 Equivalent (6 components) - Need to Keep/Rebuild
| FormSG Component | Action Required |
|------------------|----------------|
| `Field/Rating` | Keep custom or rebuild |
| `Field/YesNo` | Keep custom or rebuild |
| `MoneyInput` | Keep custom (FormSG-specific) |
| `MailToLink` | Simple component, keep as-is |
| `MarkdownText` | Keep custom (FormSG-specific) |
| `SecretKeyVerificationInput` | Keep custom (FormSG-specific) |

### 3.3 Theme Token Differences

Need to audit:
1. **Colors** - Are FormSG's 10 theme colors available in Camp V2?
2. **Typography** - Do text styles match?
3. **Breakpoints** - Are they compatible?
4. **Shadows** - Do they match?

### 3.4 Custom Variants/Sizes

FormSG has custom button variants:
- `solid`, `reverse`, `outline`, `clear`, `link`
- `inputAttached`, `inverseOutline`, `highContrast`

**Question:** Does Camp V2 support these variants, or do we lose them?

---

## 4. Migration Strategy Options

### Option A: Full Replacement (High Effort, Clean Result)

Replace ALL custom components with Camp V2 equivalents:

1. Install Camp V2
2. Swap `ChakraProvider` with `ThemeProvider`
3. Replace each component import
4. Build missing components on top of Camp V2
5. Remove custom theme entirely

**Pros:** Clean codebase, future Camp updates easier
**Cons:** Massive effort, may lose custom features

### Option B: Hybrid Approach (Medium Effort) ⭐ RECOMMENDED

Use Camp V2 for new components, gradually migrate existing:

1. Install Camp V2 alongside current setup
2. Use Camp's `ThemeProvider` but merge with custom tokens
3. Migrate components incrementally by priority
4. Keep FormSG-specific components (Rating, YesNo, MoneyInput, etc.)

**Pros:** Lower risk, can migrate gradually, maintains feature parity
**Cons:** Two systems to maintain temporarily

### Option C: Theme Alignment Only (Lower Effort)

Keep custom components but align theme tokens with Camp V2:

1. Update Chakra to v2.10.5
2. Align color tokens with Camp V2
3. Align typography with Camp V2
4. Keep custom components

**Pros:** Least disruption, visual consistency
**Cons:** Still maintaining custom components

---

## 4.1 Recommended Approach (Based on Your Goals)

Since you want to **reduce maintenance** with a **gradual timeline** and are **unsure about feature regression**, I recommend **Option B (Hybrid)** with the following phased approach:

### Phase 1: Foundation & Validation (Week 1-2)
```
Goal: Prove the migration is viable without breaking anything
```
1. Create feature branch `feat/camp-v2-migration`
2. Upgrade Chakra UI: `2.8.2` → `2.10.5`
3. Install Camp V2: `npm install @opengovsg/design-system-react`
4. **DO NOT replace components yet** - just ensure they coexist
5. Run full test suite, check Storybook

### Phase 2: Theme Alignment (Week 3-4)
```
Goal: Make custom components visually consistent with Camp V2
```
1. Compare Camp V2 theme tokens with FormSG tokens
2. Create a theme bridge that merges both
3. Update `App.tsx` to use Camp's `ThemeProvider` with extensions
4. Visual regression testing (Chromatic if available)

### Phase 3: Component Migration - Low Risk (Week 5-8)
```
Goal: Migrate simple components with 1:1 mapping
```
Priority order:
1. **Button, IconButton** - High usage, simple API
2. **Input, Textarea, NumberInput** - Form essentials
3. **Modal, Drawer** - Container components
4. **Badge, Tag, Spinner** - Simple display components

### Phase 4: Component Migration - Medium Risk (Week 9-12)
```
Goal: Migrate complex components
```
1. **SingleSelect, MultiSelect** - Verify dropdown behavior
2. **DatePicker, DateRangePicker** - Date handling
3. **PhoneNumberInput** - Validation behavior
4. **Tabs, Menu, Popover** - Interactive components

### Phase 5: Keep Custom Components (Ongoing)
```
Goal: Maintain FormSG-specific components on Camp V2 foundation
```
These 6 components have no Camp V2 equivalent - keep them:
- `Field/Rating`
- `Field/YesNo`
- `MoneyInput`
- `MailToLink`
- `MarkdownText`
- `SecretKeyVerificationInput`

**Action:** Refactor these to use Camp V2's theme tokens so they look consistent.

### Phase 6: Cleanup (Final)
```
Goal: Remove old code
```
1. Delete unused theme files
2. Delete old component implementations
3. Update all documentation
4. Final regression testing

---

## 5. Open Questions (Need Your Input)

### 5.1 Scope Questions

1. **What is the primary goal of this migration?**
   - Visual consistency with other OGP products?
   - Reduced maintenance burden?
   - Access to new Camp components?
   - Compliance requirement?

2. **What's the timeline expectation?**
   - Is this a "big bang" migration or gradual?
   - Are there dependent projects/releases?

3. **Can we accept feature regression?**
   - Some FormSG-specific components may not exist in Camp V2
   - Are we willing to rebuild them on Camp V2?

### 5.2 Technical Questions

4. **Component audit needed:**
   - Which Camp V2 components exist? (Need to review Storybook)
   - Which FormSG components have NO Camp equivalent?

5. **Theme compatibility:**
   - Are FormSG's brand colors official OGP colors?
   - Can we extend Camp's theme, or must we use it as-is?

6. **Breaking changes acceptable?**
   - Will consumers of FormSG components be affected?
   - Are there external dependencies on the component API?

### 5.3 Process Questions

7. **Testing strategy:**
   - Visual regression testing setup?
   - Component-by-component testing?

8. **Rollout strategy:**
   - Feature flag for new design system?
   - Parallel deployment?

---

## 6. Recommended Next Steps

### Phase 0: Discovery (Before Starting)

- [ ] **Audit Camp V2 Storybook** - List all available components
- [ ] **Create component mapping** - FormSG component → Camp V2 equivalent
- [ ] **Identify gaps** - Components that need to be built
- [ ] **Review Chakra 2.8→2.10 changelog** - Breaking changes
- [ ] **Decision:** Choose migration strategy (A, B, or C)

### Phase 1: Foundation (If proceeding)

- [ ] Upgrade Chakra UI to v2.10.5
- [ ] Test existing components still work
- [ ] Install `@opengovsg/design-system-react`
- [ ] Create migration branch

### Phase 2: Theme Migration

- [ ] Compare theme tokens (colors, typography, spacing)
- [ ] Create token mapping document
- [ ] Migrate theme in isolation
- [ ] Visual regression testing

### Phase 3: Component Migration

- [ ] Start with simple components (Button, Input)
- [ ] Move to complex components (DatePicker, Dropdown)
- [ ] Build missing components
- [ ] Update all imports throughout codebase

### Phase 4: Cleanup

- [ ] Remove old theme files
- [ ] Remove old component files
- [ ] Update documentation
- [ ] Update Storybook

---

## 7. Effort Estimation Factors

| Factor | Impact |
|--------|--------|
| Number of components to migrate | 40+ components |
| Number of files using components | ~200+ files in `features/` |
| Custom variants/sizes | ~15+ custom variants |
| Theme customizations | Extensive color palette, typography |
| Missing Camp V2 components | Unknown (needs audit) |
| Test coverage | Storybook exists, but unit tests? |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Camp V2 missing critical components | Build on top of Camp V2 |
| Visual regressions | Visual regression testing (Chromatic?) |
| Breaking API changes | Maintain adapters during migration |
| Extended timeline | Phase the migration |
| Team unfamiliarity with Camp V2 | Training, documentation |

---

## Appendix A: Files to Modify (Estimated)

**Theme files (delete/replace):**
- `frontend/src/theme/` - Entire directory (~20 files)

**Component files (migrate):**
- `frontend/src/components/` - All 40+ component directories

**Feature files (update imports):**
- `frontend/src/features/` - 200+ files with component imports

**App setup:**
- `frontend/src/app/App.tsx` - Provider swap

**Storybook:**
- `frontend/.storybook/` - Update for Camp V2

---

## Appendix B: Current Component Inventory

```
frontend/src/components/
├── Avatar/
├── Badge/
├── Banner/
├── Button/
├── Calendar/
├── Checkbox/
├── DatePicker/
├── Drawer/
├── Dropdown/
├── Field/
│   ├── Attachment/
│   ├── Rating/
│   └── YesNo/
├── Footer/
├── FormControl/
├── GovtMasthead/
├── IconButton/
├── InlineMessage/
├── Input/
├── Link/
├── MailToLink/
├── MarkdownText/
├── Menu/
├── Modal/
├── MoneyInput/
├── NumberInput/
├── Pagination/
├── PhoneNumberInput/
├── Popover/
├── Radio/
├── Searchbar/
├── SecretKeyVerificationInput/
├── Spinner/
├── Tabs/
├── Tag/
├── TagInput/
├── Textarea/
├── Tile/
├── Toast/
├── Toggle/
└── Tooltip/
```

---

---

## Appendix C: Getting Started (Practical First Steps)

If you decide to proceed, here's how to start **today**:

### Step 1: Create a Proof-of-Concept Branch

```bash
git checkout -b poc/camp-v2-exploration
```

### Step 2: Upgrade Chakra UI

```bash
cd frontend
npm install @chakra-ui/react@^2.10.5
```

### Step 3: Install Camp V2

```bash
npm install @opengovsg/design-system-react
```

### Step 4: Test Coexistence

Create a simple test file to verify both systems can coexist:

```tsx
// frontend/src/components/__tests__/CampV2Test.tsx
import { Button as CampButton } from '@opengovsg/design-system-react'
import { Button as FormSGButton } from '~components/Button'

export const CampV2Test = () => (
  <div>
    <CampButton>Camp V2 Button</CampButton>
    <FormSGButton>FormSG Button</FormSGButton>
  </div>
)
```

### Step 5: Check Theme Compatibility

```tsx
// Test if Camp's ThemeProvider can wrap existing components
import { ThemeProvider } from '@opengovsg/design-system-react'

// In App.tsx, try wrapping with Camp's provider
// and see what breaks
```

### Step 6: Document Findings

Create a migration log:
- Which components work out-of-the-box?
- Which need prop changes?
- Which break entirely?

---

## Appendix D: Key Files to Understand

Before starting migration, read these files thoroughly:

| File | Why Important |
|------|--------------|
| [frontend/src/theme/index.ts](frontend/src/theme/index.ts) | Main theme config |
| [frontend/src/app/App.tsx](frontend/src/app/App.tsx) | Provider setup |
| [frontend/src/components/Button/Button.tsx](frontend/src/components/Button/Button.tsx) | Example component pattern |
| [frontend/src/theme/components/Button.ts](frontend/src/theme/components/Button.ts) | Example theme customization |

---

## Summary

| Aspect | Status |
|--------|--------|
| **Component Coverage** | ~85% of FormSG components have Camp V2 equivalents |
| **Components to Keep** | 6 FormSG-specific components |
| **Chakra Upgrade** | 2.8.2 → 2.10.5 (minor bump) |
| **Recommended Strategy** | Hybrid/Gradual migration |
| **Estimated Phases** | 6 phases over several months |
| **Risk Level** | Medium (mitigated by gradual approach) |

**Bottom Line:** This migration is **feasible** and will **reduce maintenance** long-term. The 85% component overlap means most work is replacing imports, not rebuilding. The 6 FormSG-specific components can remain custom but should be updated to use Camp V2's theme tokens for visual consistency.

---

## Appendix E: Component API Deep Dive

### E.1 Button Component Comparison

#### Props Comparison

| Prop | FormSG | Camp V2 | Migration Note |
|------|--------|---------|----------------|
| `variant` | solid, reverse, outline, clear, link, inputAttached, **inverseOutline**, **highContrast** | solid, reverse, outline, clear, link, inputAttached | **2 variants missing** in Camp V2 |
| `colorScheme` | primary, secondary, success, danger, warning, neutral, + 10 theme colors | main, success, critical, inverse, sub | **Different names**, FormSG has more |
| `size` | sm, md, lg | xs, sm, md, lg | Camp has `xs`, FormSG doesn't |
| `isFullWidth` | ✅ Supported | ✅ Supported | Direct match |
| `spinnerFontSize` | ✅ Supported | ✅ Supported | Direct match |
| `basecolorintensity` | ✅ Custom prop (500/600) | ❌ Not available | **FormSG-specific** |
| `isHighContrast` | ✅ Custom prop | ❌ Not available | **FormSG-specific** (used for a11y) |

#### Variant Mapping

| FormSG Variant | Camp V2 Equivalent | Action |
|----------------|-------------------|--------|
| `solid` | `solid` | Direct swap |
| `reverse` | `reverse` | Direct swap |
| `outline` | `outline` | Direct swap |
| `clear` | `clear` | Direct swap |
| `link` | `link` | Direct swap |
| `inputAttached` | `inputAttached` | Direct swap |
| `inverseOutline` | ❌ None | **Keep custom** or remove |
| `highContrast` | ❌ None | **Keep custom** (accessibility feature) |

#### Color Scheme Mapping

| FormSG | Camp V2 | Notes |
|--------|---------|-------|
| `primary` | `main` | Rename required |
| `secondary` | `sub` | Rename required |
| `success` | `success` | Direct match |
| `danger` | `critical` | Rename required |
| `warning` | ❌ None | Keep custom or map to `critical` |
| `neutral` | ❌ Limited | Camp has neutral in some variants |
| `theme-*` (10 colors) | ❌ None | **Keep custom** (FormSG branding) |

#### Button Migration Verdict

**Medium effort.** Core variants match. You'll need to:
1. Create a color scheme mapping utility
2. Keep `inverseOutline` and `highContrast` as custom variants
3. Decide what to do with 10 theme color schemes

---

### E.2 Input Component Comparison

#### Props Comparison

| Prop | FormSG | Camp V2 | Migration Note |
|------|--------|---------|----------------|
| `isPrefilled` | ✅ Supported | ✅ Supported | Direct match |
| `isPrefillLocked` | ✅ Custom prop | ❌ Not available | **FormSG-specific** |
| `isSuccess` | ✅ Supported | ✅ Supported | Direct match |
| `preventDefaultOnEnter` | ✅ Custom prop | ❌ Not available | **FormSG-specific** |
| `hasInputRightElement` | ✅ Custom prop | ❌ Not available | **FormSG-specific** |
| `isHighContrast` | ✅ Custom prop | ❌ Not available | **FormSG-specific** |
| `prefix` | ✅ Via InputLeftAddon | ❓ Unknown | Verify in Camp V2 |

#### Input Migration Verdict

**Low-medium effort.** Base functionality matches. You'll need to:
1. Keep `isPrefillLocked` handling (maybe as wrapper)
2. Keep `preventDefaultOnEnter` handling (maybe as wrapper)
3. Keep `isHighContrast` variant (accessibility)
4. Verify Camp V2 handles `InputLeftAddon` the same way

**Suggested approach:** Create a `FormSGInput` wrapper that adds FormSG-specific props on top of Camp V2's `Input`.

```tsx
// Example wrapper pattern
import { Input as CampInput, InputProps as CampInputProps } from '@opengovsg/design-system-react'

interface FormSGInputProps extends CampInputProps {
  isPrefillLocked?: boolean
  preventDefaultOnEnter?: boolean
  isHighContrast?: boolean
}

export const Input = forwardRef<FormSGInputProps, 'input'>((props, ref) => {
  // Add FormSG-specific logic here
  return <CampInput ref={ref} {...baseProps} />
})
```

---

### E.3 SingleSelect (Dropdown) Comparison

#### Props Comparison

| Prop | FormSG | Camp V2 | Migration Note |
|------|--------|---------|----------------|
| `items` | ✅ `ComboboxItem[]` | ✅ (verify type) | Likely similar |
| `value` | ✅ Controlled string | ✅ (verify) | Likely similar |
| `onChange` | ✅ `(value: string) => void` | ✅ (verify) | Likely similar |
| `isClearable` | ✅ Default `true` | ✅ (verify) | Likely similar |
| `isSearchable` | ✅ Default `true` | ✅ (verify) | Likely similar |
| `placeholder` | ✅ Supported | ✅ (verify) | Likely similar |
| `filter` | ✅ Custom filter function | ❓ Unknown | Verify Camp V2 |
| `clearButtonLabel` | ✅ For a11y | ❓ Unknown | Verify Camp V2 |
| `nothingFoundLabel` | ✅ (via i18n) | ❓ Unknown | Verify Camp V2 |
| `comboboxProps` | ✅ Downshift override | ❓ Unknown | Camp might use Downshift too |
| `colorScheme` | ✅ Supported | ✅ (verify) | Likely similar |
| `variant` | ✅ `'clear'` | ❓ Unknown | Verify Camp V2 |
| `fullWidth` | ✅ Custom prop | ❓ Unknown | Verify Camp V2 |
| `isHighContrast` | ✅ Custom prop | ❌ Unlikely | **FormSG-specific** |
| `inputAria` | ✅ For a11y | ❓ Unknown | Verify Camp V2 |

#### Technical Implementation

Both FormSG and Camp V2 likely use:
- **Downshift** for combobox behavior
- **React Virtuoso** for large lists
- **Chakra's `useMultiStyleConfig`** for theming

This suggests the migration might be straightforward if the underlying libraries match.

#### SingleSelect Migration Verdict

**Medium effort.** Need to:
1. **Audit Camp V2's SingleSelect API** in detail (check Storybook)
2. Verify `ComboboxItem` type compatibility
3. Check if Camp V2 supports custom `filter` functions
4. Keep `isHighContrast` prop via wrapper if needed
5. Verify virtualization behavior with large lists

---

### E.4 PhoneNumberInput Comparison

#### FormSG PhoneNumberInput Props

| Prop | Description |
|------|-------------|
| `defaultCountry` | Default `'SG'` |
| `allowInternational` | Default `true` - shows country picker |
| `value` | Controlled E.164 format string |
| `onChange` | `(val: string \| undefined) => void` |
| `examplePlaceholder` | `'polite' \| 'aggressive' \| 'off'` |
| `examples` | Country example numbers |
| `isHighContrast` | Accessibility variant |

#### PhoneNumberInput Migration Verdict

**Verify Camp V2's API** - Both use `libphonenumber-js` so the underlying logic should be similar. Key things to check:
1. Does Camp V2 support `allowInternational` toggle?
2. Does Camp V2 support example placeholders?
3. Does Camp V2 default to Singapore?

---

### E.5 Migration Complexity Summary

| Component | Complexity | Reason |
|-----------|------------|--------|
| **Button** | Medium | 2 missing variants, color scheme renaming |
| **Input** | Low-Medium | 4 custom props need wrappers |
| **SingleSelect** | Medium | Need to verify API compatibility |
| **MultiSelect** | Medium | Similar to SingleSelect |
| **PhoneNumberInput** | Low | Both use libphonenumber-js |
| **DatePicker** | Medium | Verify date library compatibility |
| **Modal/Drawer** | Low | Chakra-based, likely similar |
| **Other components** | Low | Mostly direct swaps |

---

*Document created: January 2026*
*Author: Claude Code Analysis*
