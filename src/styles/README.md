# Design System Documentation

This document describes the comprehensive design system implemented for the Student Grade Management System.

## Overview

The design system provides a consistent, scalable, and responsive foundation for the application. It includes:

- **CSS Custom Properties (Variables)** for consistent theming
- **Responsive breakpoints** for mobile-first design
- **Utility classes** for rapid development
- **Component-specific styles** that leverage the design system
- **Accessibility features** built-in
- **Dark mode support** (automatic based on user preference)

## File Structure

```
src/styles/
├── design-system.css      # Core design system with CSS variables
├── responsive-utilities.css # Utility classes for responsive design
└── README.md             # This documentation
```

## Breakpoints

The design system uses a mobile-first approach with the following breakpoints:

| Breakpoint | Min Width | Max Width | Description |
|------------|-----------|-----------|-------------|
| `xs` | 0px | 479px | Extra small devices (phones) |
| `sm` | 480px | 767px | Small devices (large phones) |
| `md` | 768px | 1023px | Medium devices (tablets) |
| `lg` | 1024px | 1279px | Large devices (desktops) |
| `xl` | 1280px | 1535px | Extra large devices |
| `2xl` | 1536px+ | - | Extra extra large devices |

## Color System

### Primary Colors
- `--color-primary`: #007bff (Main brand color)
- `--color-primary-hover`: #0056b3 (Hover state)
- `--color-primary-active`: #004085 (Active state)
- `--color-primary-light`: #e3f2fd (Light variant)
- `--color-primary-dark`: #0d47a1 (Dark variant)

### Semantic Colors
- `--color-success`: #28a745 (Success states)
- `--color-warning`: #ffc107 (Warning states)
- `--color-danger`: #dc3545 (Error/danger states)
- `--color-info`: #17a2b8 (Informational states)

### Neutral Colors
- `--color-gray-50` to `--color-gray-900`: Complete gray scale
- `--color-white`: #ffffff
- `--color-background`: #f5f5f5 (Main background)
- `--color-background-alt`: #ffffff (Card/container background)

### Text Colors
- `--color-text-primary`: #333333 (Main text)
- `--color-text-secondary`: #666666 (Secondary text)
- `--color-text-muted`: #999999 (Muted text)
- `--color-text-light`: #ffffff (Light text on dark backgrounds)

## Typography

### Font Families
- `--font-family-base`: System font stack for body text
- `--font-family-mono`: Monospace font stack for code

### Font Sizes
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)
- `--font-size-5xl`: 3rem (48px)
- `--font-size-6xl`: 4rem (64px)

### Font Weights
- `--font-weight-light`: 300
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700
- `--font-weight-extrabold`: 800

### Line Heights
- `--line-height-tight`: 1.25
- `--line-height-normal`: 1.5
- `--line-height-relaxed`: 1.75

## Spacing System

The spacing system uses a consistent scale based on 0.25rem (4px) increments:

- `--spacing-0`: 0
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-5`: 1.25rem (20px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)
- `--spacing-10`: 2.5rem (40px)
- `--spacing-12`: 3rem (48px)
- `--spacing-16`: 4rem (64px)
- `--spacing-20`: 5rem (80px)
- `--spacing-24`: 6rem (96px)

## Border Radius

- `--radius-none`: 0
- `--radius-sm`: 0.125rem (2px)
- `--radius-base`: 0.25rem (4px)
- `--radius-md`: 0.375rem (6px)
- `--radius-lg`: 0.5rem (8px)
- `--radius-xl`: 0.75rem (12px)
- `--radius-2xl`: 1rem (16px)
- `--radius-full`: 9999px (fully rounded)

## Shadows

- `--shadow-sm`: Subtle shadow for slight elevation
- `--shadow-base`: Standard shadow for cards and buttons
- `--shadow-md`: Medium shadow for modals and dropdowns
- `--shadow-lg`: Large shadow for prominent elements
- `--shadow-xl`: Extra large shadow for major elevation
- `--shadow-2xl`: Maximum shadow for overlays

## Component Variables

### Header
- `--header-height`: 64px (Desktop header height)
- `--header-height-mobile`: 56px (Mobile header height)

### Sidebar
- `--sidebar-width`: 250px (Default sidebar width)
- `--sidebar-width-collapsed`: 60px (Collapsed sidebar width)
- `--sidebar-width-tablet`: 200px (Tablet sidebar width)

### Form Elements
- `--input-height`: 40px (Default input height)
- `--input-height-sm`: 32px (Small input height)
- `--input-height-lg`: 48px (Large input height)
- `--button-height-sm`: 32px (Small button height)
- `--button-height-base`: 40px (Default button height)
- `--button-height-lg`: 48px (Large button height)

## Utility Classes

### Layout
- `.container`: Responsive container with max-widths
- `.grid`: CSS Grid display
- `.flex`: Flexbox display
- `.grid-cols-{n}`: Grid column templates
- `.gap-{size}`: Grid/flex gap utilities

### Spacing
- `.p-{size}`: Padding utilities
- `.m-{size}`: Margin utilities
- `.px-{size}`, `.py-{size}`: Directional padding
- `.mx-{size}`, `.my-{size}`: Directional margin

### Typography
- `.text-{size}`: Font size utilities
- `.font-{weight}`: Font weight utilities
- `.text-{color}`: Text color utilities
- `.text-{align}`: Text alignment utilities

### Responsive Utilities
- `.{breakpoint}:hidden`: Hide at specific breakpoints
- `.{breakpoint}:block`: Show as block at specific breakpoints
- `.{breakpoint}:flex`: Show as flex at specific breakpoints
- `.{breakpoint}:grid`: Show as grid at specific breakpoints

### Width and Height
- `.w-full`: 100% width
- `.h-full`: 100% height
- `.w-{fraction}`: Fractional widths (1/2, 1/3, etc.)
- `.max-w-{size}`: Maximum width constraints

## Responsive Design Patterns

### Mobile-First Approach
All styles are written mobile-first, with larger breakpoints adding enhancements:

```css
/* Base styles for mobile */
.component {
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-6);
    font-size: var(--font-size-base);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-8);
    font-size: var(--font-size-lg);
  }
}
```

### Grid Layouts
Use CSS Grid for complex layouts:

```css
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-8);
  }
}
```

### Flexbox Layouts
Use Flexbox for component-level layouts:

```css
.flex-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .flex-container {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
```

## Accessibility Features

### Focus Management
- All interactive elements have visible focus indicators
- Focus indicators use high contrast colors
- Tab order is logical and predictable

### Color Contrast
- All color combinations meet WCAG AA standards
- High contrast mode is supported with media queries

### Screen Reader Support
- `.sr-only` class for screen reader only content
- Proper semantic HTML structure
- ARIA labels and descriptions where needed

### Reduced Motion
- Respects `prefers-reduced-motion` user preference
- Animations can be disabled system-wide

## Dark Mode Support

The design system automatically adapts to user's color scheme preference:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-background-alt: #2d2d2d;
    --color-text-primary: #ffffff;
    --color-text-secondary: #d1d5db;
    /* ... other dark mode variables */
  }
}
```

## Usage Examples

### Using Design System Variables
```css
.my-component {
  padding: var(--spacing-4);
  background-color: var(--color-background-alt);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.my-component:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Using Utility Classes
```html
<div class="container">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="p-6 bg-white rounded-lg shadow-base">
      <h3 class="text-xl font-semibold text-primary mb-4">Card Title</h3>
      <p class="text-base text-secondary">Card content goes here.</p>
    </div>
  </div>
</div>
```

### Responsive Component
```css
.responsive-card {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

@media (min-width: 768px) {
  .responsive-card {
    padding: var(--spacing-6);
    margin-bottom: var(--spacing-6);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-base);
  }
}

@media (min-width: 1024px) {
  .responsive-card {
    padding: var(--spacing-8);
    margin-bottom: var(--spacing-8);
  }
}
```

## Best Practices

### 1. Use Design System Variables
Always use CSS custom properties instead of hardcoded values:

```css
/* ✅ Good */
.component {
  color: var(--color-text-primary);
  padding: var(--spacing-4);
}

/* ❌ Bad */
.component {
  color: #333333;
  padding: 16px;
}
```

### 2. Mobile-First Responsive Design
Write styles for mobile first, then enhance for larger screens:

```css
/* ✅ Good - Mobile first */
.component {
  font-size: var(--font-size-sm);
}

@media (min-width: 768px) {
  .component {
    font-size: var(--font-size-base);
  }
}

/* ❌ Bad - Desktop first */
.component {
  font-size: var(--font-size-base);
}

@media (max-width: 767px) {
  .component {
    font-size: var(--font-size-sm);
  }
}
```

### 3. Use Semantic Class Names
Choose class names that describe purpose, not appearance:

```css
/* ✅ Good */
.error-message { color: var(--color-danger); }
.primary-button { background: var(--color-primary); }

/* ❌ Bad */
.red-text { color: var(--color-danger); }
.blue-button { background: var(--color-primary); }
```

### 4. Leverage Utility Classes
Use utility classes for common patterns to reduce CSS bloat:

```html
<!-- ✅ Good -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-base">

<!-- ❌ Bad - Custom CSS for every component -->
<div class="custom-header-component">
```

### 5. Test Across Breakpoints
Always test components across all breakpoints:
- Mobile (320px - 479px)
- Small mobile (480px - 767px)
- Tablet (768px - 1023px)
- Desktop (1024px - 1279px)
- Large desktop (1280px+)

### 6. Consider Touch Targets
Ensure interactive elements meet minimum touch target sizes:
- Minimum 44px × 44px for touch devices
- Use the touch device media query when needed

```css
@media (hover: none) and (pointer: coarse) {
  .button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Testing Responsive Design

### Browser Testing
Test in multiple browsers and devices:
- Chrome DevTools device simulation
- Firefox Responsive Design Mode
- Safari Web Inspector
- Real devices when possible

### Accessibility Testing
- Use browser accessibility tools
- Test with screen readers
- Verify keyboard navigation
- Check color contrast ratios

### Performance Testing
- Monitor CSS bundle size
- Test loading performance on slow connections
- Verify critical CSS is inlined

## Maintenance

### Adding New Variables
When adding new design tokens:
1. Add to the appropriate section in `design-system.css`
2. Include dark mode variants if needed
3. Document in this README
4. Update any related utility classes

### Updating Breakpoints
If breakpoint changes are needed:
1. Update variables in `design-system.css`
2. Update utility classes in `responsive-utilities.css`
3. Update component styles throughout the application
4. Update this documentation

### Version Control
- Use semantic versioning for design system changes
- Document breaking changes in commit messages
- Consider impact on existing components before making changes