# Integrasi Sistem Tema

Template file ini menunjukkan cara mengintegrasikan sistem tema dari dashboard-template ke repo lain.

## 1. Tailwind CSS dengan Tema

Ganti isi `apps/frontend/src/styles/tailwind.css` dengan konten dari `dashboard-template`:

```css
@import "tailwindcss";
@import "@repo/ui/tailwind.css";

@plugin 'tailwindcss-animate';
@custom-variant dark (&:is(.dark *));

/* Copy seluruh konten dari dashboard-template/apps/frontend/src/styles/tailwind.css */
/* File ini sudah include:
   - @theme dengan CSS variables
   - Color schemes untuk semua tema
   - Dynamic scrollbar styles
   - Component helper classes
   - Accessibility styles
*/
```

## 2. Setup Color Schemes

Ubah warna di file tailwind.css sesuai kebutuhan:

### Untuk Tema Teal/Cyan (seperti contoh pertama):

```css
/* Teal color scheme - Light mode */
:root[data-color-scheme="teal"] {
  --primary: 188 100% 18%; /* #004D5E */
  --primary-foreground: 0 0% 100%;
  --ring: 182 100% 35%; /* #00A5B5 */
  --sidebar-primary: 188 100% 18%;
  --sidebar-ring: 182 100% 35%;
  --primary-gradient: linear-gradient(180deg, #004d5e 0%, #007a8c 100%);
  --shadow-brand: 0 3px 10px 0 hsl(188 100% 18% / 0.25);
  --scrollbar-thumb: 182 100% 35%; /* #00A5B5 */
  --scrollbar-thumb-hover: 188 100% 27%;
}

/* Teal color scheme - Dark mode */
.dark[data-color-scheme="teal"] {
  --background: 195 45% 8%;
  --foreground: 0 0% 95%;
  --primary: 182 100% 35%; /* #00A5B5 */
  --primary-foreground: 195 45% 13%;
  --ring: 182 100% 35%;
  --sidebar-primary: 182 100% 35%;
  --sidebar-ring: 182 100% 35%;
  --primary-gradient: linear-gradient(180deg, hsl(182 100% 35%) 0%, hsl(188 100% 27%) 100%);
  --shadow-brand: 0 3px 10px 0 hsl(182 100% 35% / 0.35);
  --scrollbar-thumb: 182 100% 35%;
  --scrollbar-thumb-hover: 188 100% 27%;
}
```

### Untuk Tema Yellow/Amber (seperti contoh kedua):

```css
/* Yellow color scheme - Light mode */
:root[data-color-scheme="yellow"] {
  --primary: 45 93% 47%; /* #F59E0B */
  --primary-foreground: 0 0% 100%;
  --ring: 45 93% 47%;
  --sidebar-primary: 45 93% 47%;
  --sidebar-ring: 45 93% 47%;
  --primary-gradient: linear-gradient(180deg, #F59E0B 0%, #FCD34D 100%);
  --shadow-brand: 0 3px 10px 0 hsl(45 93% 47% / 0.25);
  --scrollbar-thumb: 45 93% 47%; /* #F59E0B */
  --scrollbar-thumb-hover: 45 86% 58%;
}

/* Yellow color scheme - Dark mode */
.dark[data-color-scheme="yellow"] {
  --background: 45 93% 8%;
  --foreground: 0 0% 95%;
  --primary: 45 93% 47%; /* #F59E0B */
  --primary-foreground: 45 93% 13%;
  --ring: 45 93% 47%;
  --sidebar-primary: 45 93% 47%;
  --sidebar-ring: 45 93% 47%;
  --primary-gradient: linear-gradient(180deg, hsl(45 93% 47%) 0%, hsl(45 86% 30%) 100%);
  --shadow-brand: 0 3px 10px 0 hsl(45 93% 47% / 0.35);
  --scrollbar-thumb: 45 93% 47%;
  --scrollbar-thumb-hover: 45 86% 58%;
}
```

## 3. Menggunakan Component Classes

Setelah CSS diintegrasikan, gunakan helper classes di komponen:

### Buttons dengan Gradient
```tsx
<button className="btn-primary">
  Save Changes
</button>
```

### Cards dengan Hover Effect
```tsx
<div className="card-hover p-6">
  <h3 className="text-h3">Card Title</h3>
  <p className="text-body-md">Card content</p>
</div>
```

### Sidebar dengan Tema
```tsx
<aside className="sidebar-elegant">
  <div className="sidebar-header">
    <Logo />
  </div>
  
  <nav>
    <div className="sidebar-group-label">Main</div>
    <Link className="sidebar-menu-button active">
      <HomeIcon className="sidebar-menu-icon" />
      <span>Dashboard</span>
    </Link>
  </nav>
  
  <div className="sidebar-user-card">
    <div className="sidebar-user-name">John Doe</div>
    <div className="sidebar-user-email">john@example.com</div>
  </div>
</aside>
```

### Scrollable Area
```tsx
<div className="scrollable h-96 overflow-y-auto">
  {/* Scrollbar akan otomatis mengikuti tema */}
  <LongContent />
</div>
```

## 4. Badges dengan Tema
```tsx
<span className="badge badge-primary">New</span>
<span className="badge badge-secondary">Updated</span>
```

## 5. Custom Elements dengan CSS Variables

```tsx
<div 
  className="rounded-lg p-4"
  style={{
    background: 'var(--primary-gradient)',
    boxShadow: 'var(--shadow-brand)',
    color: 'hsl(var(--primary-foreground))'
  }}
>
  Custom styled element with theme colors
</div>
```

## 6. Sidebar Avatar Status dengan Tema

```tsx
<div className="relative">
  <Avatar />
  <span className="sidebar-avatar-status" />
</div>
```

Status indicator akan otomatis menggunakan warna primary dari tema yang aktif.

## Testing Tema

Setelah integrasi, test dengan:

1. Ubah theme mode (light/dark/system)
2. Ubah color scheme (teal, yellow, blue, dll)
3. Scroll halaman - cek apakah scrollbar berubah warna
4. Hover buttons - cek gradient dan shadow
5. Test di berbagai browser

## Struktur File yang Perlu Ada

```
apps/frontend/src/
├── styles/
│   └── tailwind.css          # Sistem tema lengkap
├── components/
│   └── ThemeSettings.tsx     # Theme picker UI
├── contexts/
│   └── Theme/
│       └── ThemeProvider.tsx # Theme management
└── indexedDB/
    └── themeDB.ts            # Local storage

docs/frontend/
└── theming.md                # Dokumentasi tema
```

## Catatan Penting

1. **CSS Variables**: Semua warna menggunakan CSS variables untuk transisi smooth
2. **Scrollbar**: Otomatis mengikuti `--scrollbar-thumb` dan `--scrollbar-thumb-hover`
3. **Gradients**: Gunakan `var(--primary-gradient)` untuk buttons dan cards
4. **Shadows**: Gunakan `var(--shadow-brand)` untuk branded shadows
5. **Accessibility**: Dark mode sudah dioptimasi untuk kontras

## Migrasi dari Repo Lain

Jika repo lain sudah punya sistem tema:

1. Backup tema existing
2. Merge CSS variables dari dashboard-template
3. Update component classes
4. Test semua halaman
5. Adjust colors sesuai brand
6. Commit dan deploy

## Troubleshooting

**Q: Scrollbar tidak berubah warna?**
A: Pastikan element punya class `scrollable` atau global scrollbar styles sudah loaded.

**Q: Gradient tidak terlihat?**
A: Check apakah `var(--primary-gradient)` sudah defined di color scheme yang aktif.

**Q: Tema tidak persist setelah refresh?**
A: Pastikan `ThemeProvider` sudah setup dengan IndexedDB.
