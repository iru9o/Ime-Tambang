# Spec: Responsive Layout & Desktop Scaling for IME Tambang

This document describes the design specifications for improving the layout scaling on desktop screens and implementing a responsive mobile experience for the IME Tambang Crafting Optimizer application.

## 1. Goal & Context

- **Desktop Experience:** The application currently feels a bit small and restricted on desktop screens (limited to 1280px container width and small text sizes like `text-xs` or `text-[10px]`). We want to expand the container and scale elements proportionally.
- **Mobile Experience:** On mobile screens, the layouts overlap, and optimization results are cut off because the page layout restricts height to `h-screen overflow-hidden` while stacking all panels vertically. We want to implement a tab-switching mechanism inside the Calculator panel on mobile, so the user toggles between "Input Stok" (Inventory) and "Hasil Optimasi" (Results) without any vertical overflow or overlapping elements.
- **Stats Bar:** The bottom stats bar contains 6 columns which overlap on narrow screens. We want to layout them in a responsive grid.

---

## 2. Proposed Changes

### 2.1. Desktop Sizing and Scaling
- Modify the main container from `max-w-7xl` to `max-w-[1440px]` (or `lg:max-w-[1440px]`) to utilize wide screen space.
- Scale typography responsively using Tailwind screen modifiers:
  - Header Title: `text-sm` -> `text-sm sm:text-base`
  - Header Subtitle: `text-[9px]` -> `text-[9px] sm:text-[11px]`
  - Panel Titles: `text-xs` -> `text-xs sm:text-sm`
  - Inventory items text: `text-[11px]` -> `text-[11px] sm:text-xs`
  - Inventory items input: `text-sm` -> `text-sm sm:text-base`
  - Result panel counts & text: `text-[10px]` -> `text-[10px] sm:text-xs`
  - Button text: `text-xs` -> `text-xs sm:text-sm`

### 2.2. Header Optimization
- Hide the logo description (`IME Tambang / Crafting Optimizer` text) on mobile screens using class `hidden sm:block` on the wrapper, leaving only the gradient lightning bolt icon on mobile.
- Adjust the main navigation header padding and gap responsively:
  - Container padding: `px-4 py-2` -> `px-3 sm:px-4 py-2`
  - Gap: `gap-4` -> `gap-2 sm:gap-4`
  - Button padding: `px-3 py-1.5` -> `px-2.5 py-1 sm:px-3 sm:py-1.5`

### 2.3. Mobile Sub-Tab Switcher (Calculator)
- Add a new state variable in JavaScript: `let activeCalculatorTab = 'inventory';`
- Implement a JavaScript function `switchCalculatorTab(tab)` to change between `'inventory'` and `'results'`. This function will:
  - Toggle CSS classes on the sub-tab buttons.
  - Hide/show the respective panels.
- Add an HTML markup block for the switcher at the top of `#panel-calculator` (visible only on mobile `lg:hidden`):
  ```html
  <div id="calculator-subnav" class="lg:hidden flex bg-elevated border border-border rounded-xl p-1 shrink-0 mb-2">
      <button id="subnav-inventory" onclick="switchCalculatorTab('inventory')" class="...">
          Input Stok
      </button>
      <button id="subnav-results" onclick="switchCalculatorTab('results')" class="...">
          Hasil Optimasi
      </button>
  </div>
  ```
- Adjust panel wrappers inside `#panel-calculator`:
  - **Left Panel (Inventory):** Add ID `panel-inventory`. On mobile, it will be visible/hidden based on active tab. Tailwind classes: `w-full lg:w-5/12`.
  - **Right Panel (Results):** Add ID `panel-results` to the `lg:w-7/12 flex flex-col shrink-0 gap-3` wrapper. On mobile, it will be visible/hidden based on active tab. Tailwind classes: `w-full lg:w-7/12`.
- When switching pages via the main nav (e.g. from Calculator to Item Info), ensure the main navigation `switchNav(tab)` hides/shows panels correctly.
- Add responsiveness to the sub-navigation visibility: `calculator-subnav` is only visible when the main nav is on `calculator` AND the screen is mobile.

### 2.4. Stats Bar Grid Layout
- Change the stats bar wrapper from `grid-cols-6` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`:
  ```html
  <div id="stats-bar" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-3 pb-3 shrink-0">
  ```
- Change card paddings and text sizes responsively so that statistics numbers fit perfectly without overflow on mobile screens.

---

## 3. Verification Plan

### Manual Verification
- **Desktop Sizing Test:** Verify that the main container fits nicely on wide screens and has larger, highly readable typography.
- **Mobile Emulation Test:** In Chrome DevTools, toggle device mode (mobile view, e.g. iPhone 12 Pro) and check:
  - The header wraps nicely without clipping.
  - The sub-tab bar ("Input Stok" / "Hasil Optimasi") is visible.
  - Clicking "Input Stok" displays the inventory grid.
  - Clicking "Hasil Optimasi" displays the results panels.
  - The Stats Bar displays in a clean 2x3 grid and numbers do not overlap.
  - View database loads successfully and calculation works fine in both sub-tabs.
