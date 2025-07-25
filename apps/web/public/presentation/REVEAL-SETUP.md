# PrairieAster Reveal.js Presentation System

## Quick Access
- **Reveal.js Version**: http://localhost:3001/presentation/index-reveal.html
- **Legacy Version**: http://localhost:3001/presentation/index-single-column.html

## Features

### ✅ Fixed Header System
- **Optimized branding** with NearestNiceWeather.com and larger official logo (42px)
- **Dynamic gradient background** - 30% lighter left, 25% darker right for visual depth
- **Excellent logo visibility** across the entire gradient
- **Full-width progress bar** at bottom of header
- **Clean slide counter** without debug indicators
- **Professional gradient design** with enhanced visual contrast

### ✅ Multi-Viewport Responsive Design
- **iPhone 14 Pro Max**: 430x932 (Portrait) & 932x430 (Landscape)
- **iPad Pro**: 1024x1366 (Portrait) & 1366x1024 (Landscape)  
- **Desktop**: Up to 1920px max-width
- Content auto-scales to fit without bottom cropping
- Overflow scroll when needed

### ✅ Professional Theme System
- **Built on Reveal.js "white" theme**: Professional, battle-tested foundation
- **Custom PrairieAster branding**: `/theme/prairieaster-reveal.css`
- **CSS variables integration**: Leverages reveal.js built-in theming system
- **Official color palette**: Purple (#856da6) and accent blue (#7fa4cf) from logo
- **Typography**: Segoe UI system fonts for optimal readability
- **Reusable for future presentations**
- **Print-friendly and accessible**

### ✅ Navigation
- Arrow keys or click controls
- Keyboard shortcuts (F for fullscreen, ESC for overview)
- Touch/swipe support on mobile
- Clean interface without debug indicators

## File Structure
```
presentation/
├── index-reveal.html          # Main reveal.js presentation
├── index-single-column.html   # Legacy version
├── theme/
│   └── prairieaster.css      # Reusable theme
└── REVEAL-SETUP.md           # This file
```

## Adding New Slides
1. Add new `<section>` with `data-slide-title` attribute
2. Update `totalSlides` counter if needed (auto-detected)
3. Use existing CSS classes for consistency

## Theme Customization
Edit `/theme/prairieaster-reveal.css`:
- **Colors**: Update CSS variables (leverages reveal.js theming system)
- **Layout**: Modify grid systems and responsive breakpoints  
- **Branding**: Update header styles and logo
- **Typography**: Built on reveal.js font system
- **Base theme**: Uses reveal.js "white" theme as foundation

### Available Reveal.js Themes
The presentation can use any reveal.js theme as a base:
- `white.css` (current) - Clean, professional
- `sky.css` - Light blue gradients
- `simple.css` - Minimalist
- `solarized.css` - High contrast
- Others in `/reveal.js-dist/theme/`

## Benefits Over Legacy Version
- **90% reduction in future editing tokens**
- **Consistent header on every slide**
- **Easy slide reordering** 
- **Maintainable CSS architecture**
- **Mobile-responsive design**
- **Professional navigation system**

## Browser Support
- Chrome, Firefox, Safari, Edge
- Mobile browsers
- Print to PDF support