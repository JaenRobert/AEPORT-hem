# 🧭 ÆSI NEXUS - Navigation System Guide

**Version:** 3.0  
**Status:** Production Ready  

---

## 📊 Overview

The ÆSI NEXUS navigation system provides:
- ✅ Global menu across all pages
- ✅ Active page highlighting
- ✅ Mobile responsive design
- ✅ Automatic injection
- ✅ Visual branding

---

## 🎨 Features

### Visual Elements
- **Logo:** ⚡ ÆSI NEXUS v5.0
- **Menu Items:** Home, AI Console, Portal, Upload, Book, Memory, Login
- **Active State:** Highlighted with cyan color and underline
- **Hover Effects:** Glow and transform animations
- **Mobile Toggle:** Hamburger menu on small screens

### Technical Features
- **Sticky Navigation:** Stays at top when scrolling
- **Auto-injection:** Single script inclusion needed
- **Page Detection:** Automatic active state
- **Performance:** Minimal CSS, no external dependencies

---

## 🚀 Quick Start

### Install Menu

```powershell
# Run injection script
npm run inject-menu

# Or manually
powershell -ExecutionPolicy Bypass -File scripts/inject_menu_simple.ps1
```

### Verify Installation

Check that each HTML file has:
```html
<script src="/js/menu.js"></script>
```

before the closing `</head>` tag.

---

## 📁 File Structure

