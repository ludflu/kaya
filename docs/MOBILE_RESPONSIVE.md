# Mobile & Tablet Responsive Design Plan

## Overview

This document outlines the plan to make Kaya mobile and tablet friendly for both web and desktop (Tauri) platforms. The focus is on responsive UI/UX and touch interactions, not native iOS/Android apps.

## Goals

1. **Responsive layouts** that adapt to screen size (phone, tablet, desktop)
2. **Touch-friendly interactions** for stone placement and navigation
3. **Optimized touch targets** (minimum 44×44px)
4. **Maintain desktop experience** - no regressions for mouse/keyboard users

## Breakpoints

| Device  | Width          | Layout                           |
| ------- | -------------- | -------------------------------- |
| Mobile  | < 768px        | Full-screen board + bottom tabs  |
| Tablet  | 768px - 1024px | Full-screen board + bottom tabs  |
| Desktop | > 1024px       | Current 3-panel resizable layout |

---

## Implementation Phases

### Phase 1: Basic Mobile Layout (P0)

**Goal:** App is usable on mobile screens with proper layout

#### 1.1 CSS Foundation

- [x] Add CSS custom properties for breakpoints
- [x] Add viewport meta tag verification
- [x] Create mobile styles in `theme.css`

#### 1.2 Header Responsive

- [x] Existing: Button text hidden on medium screens (< 1100px)
- [x] Existing: Secondary actions hidden (< 800px)
- [x] Existing: Filename hidden (< 600px)
- [x] Mobile-specific header adjustments (< 768px)
- [x] Collapse to essential actions only
- [x] Landscape-specific compact header (max-height: 500px)

#### 1.3 Layout Restructure

- [x] Replace resizable panels with stacked layout on mobile
- [x] Bottom tab bar for: Board | Tree | Info | Analysis (`MobileTabBar` component)
- [x] Full-screen board by default on mobile
- [x] Orientation detection (portrait vs landscape)
- [x] Landscape-specific layout optimizations
- [ ] Sidebar becomes a drawer/sheet on tablet (future)

#### 1.4 Board Controls

- [x] Compact mobile BoardControls layout
- [x] Single-row player info display
- [x] Larger touch targets (min 44px in CSS)
- [x] Landscape-specific compact controls
- [x] Action buttons: icons-only on mobile, scrollable container

#### 1.5 Game Action Toolbar

- [x] Mobile-specific compact layout (icons only)
- [x] Horizontal scrollable on overflow
- [x] Landscape-specific sizing

---

### Phase 2: Touch Interactions (P0)

**Goal:** Touch users can play Go comfortably

#### 2.1 Goban Touch Events

- [x] Add `onTouchStart`, `onTouchMove`, `onTouchEnd` handlers
- [x] Implement touch-to-vertex coordinate calculation
- [x] Handle multi-touch (prevent accidental plays during zoom)

#### 2.2 Stone Placement UX

Options (pick one):

- **Option A: Tap-to-place** - Direct tap places stone (risky for misclicks)
- **Option B: Tap-hold-release** - Hold shows preview, release places
- **Option C: Tap-confirm** - Tap shows preview + confirm button
- [x] Current: Tap fallback to click for basic functionality
- [ ] Implement chosen option with visual feedback (future)

#### 2.3 Swipe Navigation

- [x] Swipe left on board = next move
- [x] Swipe right on board = previous move
- [x] Detect swipe vs. tap gesture
- [ ] Visual feedback during swipe (future)

#### 2.4 Touch Target Sizing

- [x] Ensure all buttons are min 44×44px on mobile (CSS)
- [ ] Increase game tree node touch targets
- [ ] Larger scoring/dead stone tap areas

---

### Phase 3: Advanced Touch Features (P1)

**Goal:** Premium touch experience

#### 3.1 Pinch-to-Zoom

- [ ] Implement pinch gesture detection
- [ ] Zoom board around pinch center
- [ ] Pan board when zoomed
- [ ] Reset zoom button

#### 3.2 Haptic Feedback

- [ ] Vibration on stone placement (Web Vibration API)
- [ ] Haptic on navigation actions
- [ ] Respect system haptic settings

#### 3.3 Orientation Handling

- [x] Orientation detection hook (`useOrientation`)
- [x] Optimize layout for landscape on phones
- [x] Compact tab bar in landscape (icons only)
- [ ] Optimize layout for landscape on tablets
- [ ] Consider orientation lock option for 19×19

---

### Phase 4: Polish (P2)

#### 4.1 PWA Enhancements

- [ ] Fullscreen mode for mobile web
- [ ] `theme-color` meta tag
- [ ] Splash screen optimization

#### 4.2 Virtual Keyboard Handling

- [ ] Adjust layout when keyboard opens (comment editor)
- [ ] Prevent keyboard from covering input

#### 4.3 Performance

- [ ] Reduce re-renders on touch move
- [ ] Optimize for lower-powered mobile devices

---

## Component Changes

### `@kaya/shudan` - Goban Component

```tsx
// New props needed
interface GobanProps {
  // ... existing props
  onTouchStart?: (evt: React.TouchEvent, vertex: Vertex) => void;
  onTouchMove?: (evt: React.TouchEvent, vertex: Vertex | null) => void;
  onTouchEnd?: (evt: React.TouchEvent, vertex: Vertex | null) => void;
  touchMode?: 'tap' | 'hold' | 'confirm';
  enablePinchZoom?: boolean;
}
```

### `@kaya/ui` - ResizableLayout

```tsx
// Needs to detect screen size and switch modes
type LayoutMode = 'desktop' | 'tablet' | 'mobile';

// Mobile: tabs instead of panels
// Tablet: drawer instead of fixed sidebar
// Desktop: current resizable panels
```

### `@kaya/ui` - New Components Needed

1. **`MobileTabBar`** - Bottom navigation tabs
2. **`DrawerSidebar`** - Slide-out drawer for tablet
3. **`TouchConfirmOverlay`** - Stone placement confirmation
4. **`SwipeNavigator`** - Gesture detection wrapper

---

## CSS Strategy

### New Files

- `packages/ui/src/styles/mobile.css` - Mobile overrides
- `packages/ui/src/styles/breakpoints.css` - Shared breakpoint variables

### CSS Custom Properties

```css
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-tablet: 1024px;
  --touch-target-min: 44px;
  --mobile-nav-height: 56px;
}
```

### Media Query Pattern

```css
/* Mobile-first base styles */
.component {
  /* mobile styles */
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    /* tablet styles */
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    /* desktop styles */
  }
}
```

---

## Touch UX Decision: Tap-Confirm Pattern

After consideration, **Option C: Tap-Confirm** is recommended for stone placement:

1. **Tap** an intersection → Shows ghost stone + small "✓" confirm button nearby
2. **Tap confirm** → Places stone
3. **Tap elsewhere** → Moves preview to new position
4. **Timeout** (3s) → Preview disappears

**Rationale:**

- Prevents misclicks (costly in Go)
- Works without hover preview
- Clear visual feedback
- Familiar pattern from mobile games

---

## Testing Strategy

- [ ] Test on iOS Safari (iPhone SE, iPhone 14, iPad)
- [ ] Test on Android Chrome (various screen sizes)
- [ ] Test on desktop with touch simulation
- [ ] Test with browser dev tools device emulation
- [ ] Test in Tauri desktop with touch screen

---

## Files to Modify

<!-- markdownlint-disable MD060 -->

| File                                                    | Changes                            | Status             |
| ------------------------------------------------------- | ---------------------------------- | ------------------ |
| `packages/shudan/src/Goban.tsx`                         | Touch handlers, gesture detection  | ✅ Done            |
| `packages/shudan/src/types.ts`                          | Touch event props                  | ✅ Done            |
| `packages/ui/src/hooks/useMediaQuery.ts`                | Layout mode, orientation detection | ✅ Updated         |
| `packages/ui/src/hooks/useSwipeGesture.ts`              | Swipe navigation                   | ✅ Created         |
| `packages/ui/src/components/layout/MobileTabBar.tsx`    | Bottom tabs                        | ✅ Created         |
| `packages/ui/src/components/layout/MobileTabBar.css`    | Tab styles, landscape compact      | ✅ Updated         |
| `packages/ui/src/components/layout/ResizableLayout.tsx` | Mobile layout, orientation         | ✅ Updated         |
| `packages/ui/src/components/layout/ResizableLayout.css` | Mobile/landscape styles            | ✅ Updated         |
| `packages/ui/src/components/layout/Header.css`          | Mobile/landscape header            | ✅ Updated         |
| `packages/ui/src/components/board/GameBoard.tsx`        | Mobile action bar classes          | ✅ Updated         |
| `packages/ui/src/components/board/GameBoard.css`        | Mobile action toolbar              | ✅ Updated         |
| `packages/ui/src/components/board/BoardControls.css`    | Mobile/landscape controls          | ✅ Updated         |
| `packages/ui/src/styles/theme.css`                      | Breakpoint/sizing variables        | ✅ Updated         |
| `apps/web/index.html`                                   | Viewport meta                      | ✅ Already present |
| `apps/desktop/index.html`                               | Viewport meta                      | ✅ Already present |

---

## Success Criteria

1. ✅ App is fully usable on iPhone SE (smallest common screen)
2. ✅ Stone placement works reliably with touch
3. ✅ Navigation is intuitive with swipe/tap
4. ✅ No regression on desktop experience
5. ✅ Performance remains smooth on mobile devices
