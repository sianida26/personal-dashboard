# Theming System

Sistem tema dinamis yang mendukung mode gelap/terang dan berbagai skema warna dengan scrollbar dan komponen yang mengikuti tema.

## Fitur

- **Theme Mode**: Light, Dark, System
- **Color Schemes**: 12 skema warna (default, blue, purple, green, orange, red, pink, teal, yellow, cyan, indigo, rose)
- **Dynamic Scrollbar**: Scrollbar otomatis mengikuti warna tema yang dipilih
- **CSS Variables**: Semua komponen menggunakan CSS variables untuk transisi tema yang smooth
- **Cross-tab Sync**: Perubahan tema tersinkronisasi antar tab
- **Backend Sync**: Tema tersimpan di backend untuk konsistensi antar device

## Struktur

### CSS Variables

Setiap color scheme mendefinisikan variables berikut:

```css
--primary
--primary-foreground
--primary-gradient
--shadow-brand
--scrollbar-thumb
--scrollbar-thumb-hover
```

### Penggunaan

#### 1. Menggunakan Theme Settings Component

```tsx
import { ThemeSettings } from "@/components/ThemeSettings";

// Sebagai dropdown item
<ThemeSettings>
  <TbPalette size={16} />
  <span>Theme</span>
</ThemeSettings>

// Standalone
<ThemeSettings />
```

#### 2. Mengakses Theme Context

```tsx
import { useTheme } from "@/contexts/Theme/ThemeProvider";

function MyComponent() {
  const { themeMode, colorScheme, setThemeMode, setColorScheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {themeMode}</p>
      <p>Current color: {colorScheme}</p>
    </div>
  );
}
```

#### 3. Menggunakan Helper Classes

##### Buttons
```tsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-ghost">Ghost Button</button>
<button className="btn-destructive">Destructive Button</button>
```

##### Cards
```tsx
<div className="card-hover">
  Card content with hover effect
</div>
```

##### Typography
```tsx
<h1 className="text-h1">Heading 1</h1>
<h2 className="text-h2">Heading 2</h2>
<h3 className="text-h3">Heading 3</h3>
<p className="text-body-lg">Large body text</p>
<p className="text-body-md">Medium body text</p>
<p className="text-body-sm">Small body text</p>
<p className="text-brand">Branded text color</p>
```

##### Badges
```tsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-secondary">Secondary</span>
```

##### Alerts
```tsx
<div className="alert alert-success">Success message</div>
<div className="alert alert-destructive">Error message</div>
<div className="alert alert-info">Info message</div>
```

##### Sidebar Components
```tsx
<div className="sidebar-elegant">
  <div className="sidebar-header">Logo</div>
  
  <div className="sidebar-group-label">Navigation</div>
  
  <button className="sidebar-menu-button active">
    <Icon className="sidebar-menu-icon" />
    <span>Active Item</span>
  </button>
  
  <button className="sidebar-menu-button">
    <Icon className="sidebar-menu-icon" />
    <span>Menu Item</span>
  </button>
</div>
```

##### Scrollable Areas
```tsx
<div className="scrollable h-96">
  {/* Scrollbar akan mengikuti tema */}
  Long content...
</div>
```

#### 4. Menggunakan CSS Variables Langsung

```tsx
<div style={{ 
  background: 'var(--primary-gradient)',
  boxShadow: 'var(--shadow-brand)' 
}}>
  Custom styled element
</div>
```

## Menambahkan Color Scheme Baru

1. Tambahkan ke `ThemeSettings.tsx`:

```tsx
const colorSchemes = [
  // ... existing schemes
  {
    value: "custom",
    label: "Custom",
    preview: "hsl(280 80% 50%)",
    bgClass: "bg-custom-600",
  },
];
```

2. Tambahkan CSS variables di `tailwind.css`:

```css
/* Custom color scheme - Light mode */
:root[data-color-scheme="custom"] {
  --primary: 280 80% 50%;
  --primary-foreground: 0 0% 100%;
  --ring: 280 80% 50%;
  --sidebar-primary: 280 80% 50%;
  --sidebar-ring: 280 80% 50%;
  --primary-gradient: linear-gradient(180deg, hsl(280 80% 50%) 0%, hsl(280 80% 60%) 100%);
  --shadow-brand: 0 3px 10px 0 hsl(280 80% 50% / 0.25);
  --scrollbar-thumb: 280 80% 50%;
  --scrollbar-thumb-hover: 280 80% 60%;
}

/* Custom color scheme - Dark mode */
.dark[data-color-scheme="custom"] {
  --primary: 280 80% 60%;
  --primary-foreground: 0 0% 100%;
  --ring: 280 80% 60%;
  --sidebar-primary: 280 80% 60%;
  --sidebar-ring: 280 80% 60%;
  --primary-gradient: linear-gradient(180deg, hsl(280 80% 60%) 0%, hsl(280 80% 70%) 100%);
  --shadow-brand: 0 3px 10px 0 hsl(280 80% 60% / 0.35);
  --scrollbar-thumb: 280 80% 60%;
  --scrollbar-thumb-hover: 280 80% 70%;
}
```

3. Update validation schema di `packages/validation`:

```ts
export const colorSchemes = [
  // ... existing schemes
  "custom",
] as const;
```

## Best Practices

1. **Selalu gunakan CSS variables** daripada hardcode colors
2. **Gunakan helper classes** untuk konsistensi
3. **Test di light dan dark mode** untuk setiap skema warna
4. **Pertimbangkan kontras** untuk aksesibilitas
5. **Gunakan .scrollable class** untuk area yang perlu custom scrollbar

## Integrasi dengan Repo Lain

Ketika merge ke repo lain, pastikan:

1. Copy `apps/frontend/src/styles/tailwind.css` dengan sistem tema lengkap
2. Pastikan `ThemeProvider` dan `ThemeSettings` components ada
3. Setup IndexedDB untuk theme persistence (`indexedDB/themeDB.ts`)
4. Backend endpoint untuk sync tema (`/users/me/theme`)
5. Validation schema untuk `ColorScheme` dan `ThemeMode`

File-file yang perlu ada:
- `apps/frontend/src/styles/tailwind.css` - Core theme system
- `apps/frontend/src/components/ThemeSettings.tsx` - Theme picker UI
- `apps/frontend/src/contexts/Theme/ThemeProvider.tsx` - Theme management
- `apps/frontend/src/indexedDB/themeDB.ts` - Local storage
- `packages/validation/src/theme.ts` - Type definitions

## Troubleshooting

### Scrollbar tidak berubah warna
Pastikan element memiliki class `scrollable` atau scrollbar global sudah diterapkan.

### Tema tidak persist
Check IndexedDB dan pastikan `ThemeProvider` membungkus aplikasi.

### Gradient tidak terlihat
Pastikan menggunakan `var(--primary-gradient)` bukan `hsl(var(--primary))`.

### Dark mode tidak aktif
Pastikan `next-themes` provider ada dan `data-color-scheme` attribute diset.
