# Component Theming Updates

Dokumentasi perubahan styling untuk membuat tema lebih terasa pada komponen-komponen utama.

## Update yang Dilakukan

### 1. **AppSidebar** - User Profile Section
Menambahkan efek hover dan border dengan warna tema:

```tsx
// Before
<SidebarMenuButton className="h-16 rounded-sm border pl-2 flex w-full items-center justify-between">
  <img src={defaultProfilePicture} alt="User avatar" className="h-12 rounded-xl" />
</SidebarMenuButton>

// After
<SidebarMenuButton 
  className="h-16 rounded-lg border pl-2 flex w-full items-center justify-between transition-all duration-200 hover:shadow-[0_0_8px_0_hsl(var(--primary)_/_0.15)]" 
  style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}
>
  <img src={defaultProfilePicture} alt="User avatar" className="h-12 rounded-xl ring-2 ring-primary/20" />
</SidebarMenuButton>
```

**Efek:**
- Border menggunakan warna primary dengan opacity 20%
- Hover memberikan shadow dengan warna tema
- Avatar memiliki ring dengan warna primary

### 2. **DropdownMenu** - Global Shadow & Border
Dropdown menu sekarang menggunakan shadow dan border yang mengikuti tema:

```tsx
// packages/ui/src/components/dropdown-menu.tsx
className={cn(
  "z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground",
  "shadow-[0_4px_12px_0_hsl(var(--primary)_/_0.15)] border-primary/10",
  // ... animations
)}
```

**Efek:**
- Shadow menggunakan warna primary (15% opacity)
- Border menggunakan warna primary (10% opacity)
- Lebih harmonis dengan tema yang dipilih

### 3. **Checkbox** - Interactive Theme Colors
Checkbox sekarang memiliki interaksi yang jelas dengan warna tema:

```tsx
// packages/ui/src/components/checkbox.tsx
className={cn(
  "peer h-4 w-4 shrink-0 rounded border border-primary/50 shadow-sm transition-all duration-200",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30",
  "hover:border-primary/70 hover:shadow-[0_0_4px_0_hsl(var(--primary)_/_0.2)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
  "data-[state=checked]:shadow-[0_0_8px_0_hsl(var(--primary)_/_0.3)]",
)}
```

**Efek:**
- Border default: primary dengan 50% opacity
- Hover: border menjadi 70% opacity dengan shadow
- Focus: ring dengan warna primary
- Checked: background primary dengan shadow glow effect

### 4. **Input** - Focus Glow Effect
Input field sekarang memiliki glow effect saat focus:

```tsx
// packages/ui/src/components/input.tsx
className={cn(
  "... transition-all duration-200 hover:border-primary/50",
  error
    ? "border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:shadow-[0_0_8px_0_hsl(var(--destructive)_/_0.2)]"
    : "border-input focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_8px_0_hsl(var(--primary)_/_0.15)]"
)}
```

**Efek:**
- Hover: border berubah ke primary/50
- Focus: border primary + ring + glow shadow
- Error state: menggunakan destructive color dengan glow merah

### 5. **AdaptiveTable** - Theme Accents
Table menggunakan class `table-themed` untuk styling tema:

```tsx
<table className="border-collapse table-themed">
```

**CSS Styling:**
```css
.table-themed thead {
  background: hsl(var(--primary) / 0.03);
}

.table-themed thead th {
  border-color: hsl(var(--primary) / 0.2);
}

.table-themed tbody tr:hover {
  background: hsl(var(--primary) / 0.05);
}
```

**Efek:**
- Header memiliki background dengan warna primary (3% opacity)
- Border header menggunakan warna primary (20% opacity)
- Row hover menggunakan warna primary (5% opacity)

### 6. **CSS Helper Classes** (di tailwind.css)

Ditambahkan helper classes baru:

#### `.dropdown-themed`
```css
.dropdown-themed {
  @apply bg-popover border rounded-lg;
  box-shadow: var(--shadow-lg);
  border-color: hsl(var(--primary) / 0.1);
}
```

#### `.checkbox-themed`
```css
.checkbox-themed {
  @apply border-primary/50 focus-visible:ring-primary;
  box-shadow: 0 0 0 1px hsl(var(--primary) / 0.1);
}

.checkbox-themed:hover {
  border-color: hsl(var(--primary) / 0.7);
}

.checkbox-themed[data-state="checked"] {
  background: var(--primary-gradient);
  border-color: hsl(var(--primary));
  box-shadow: var(--shadow-brand);
}
```

#### `.input-themed`
```css
.input-themed {
  @apply border-input focus-visible:border-primary/50;
  transition: all 0.2s ease;
}

.input-themed:focus-visible {
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary));
}
```

#### `.table-themed`
```css
.table-themed thead {
  background: hsl(var(--primary) / 0.03);
}

.table-themed thead th {
  @apply border-b-2;
  border-color: hsl(var(--primary) / 0.2);
}

.table-themed tbody tr:hover {
  background: hsl(var(--primary) / 0.05);
}
```

## Cara Menggunakan

### Automatic (Sudah Applied)
Komponen-komponen berikut sudah otomatis menggunakan styling tema:
- ✅ AppSidebar user profile section
- ✅ All dropdown menus
- ✅ All checkboxes
- ✅ All input fields
- ✅ AdaptiveTable

### Manual (Optional)
Jika ingin menambahkan styling tema manual pada komponen custom:

```tsx
// Dropdown custom
<DropdownMenuContent className="dropdown-themed">
  {/* content */}
</DropdownMenuContent>

// Checkbox custom (jika tidak pakai component dari @repo/ui)
<input type="checkbox" className="checkbox-themed" />

// Input custom
<input type="text" className="input-themed" />

// Table custom
<table className="table-themed">
  {/* table content */}
</table>
```

## Visual Effects per Theme

Setiap color scheme akan memberikan warna yang berbeda pada:

### Blue Theme
- Shadow & glow: Biru
- Border focus: Biru
- Hover effects: Biru

### Teal Theme
- Shadow & glow: Teal/Cyan
- Border focus: Teal
- Hover effects: Teal

### Yellow Theme
- Shadow & glow: Yellow/Amber
- Border focus: Yellow
- Hover effects: Yellow

### Dan seterusnya...

Semua efek secara otomatis mengikuti warna `--primary` dari tema yang aktif.

## Testing

Untuk test perubahan ini:

1. Buka aplikasi
2. Ganti theme dari ThemeSettings
3. Cek komponen-komponen berikut:
   - ✅ Sidebar user profile (hover untuk lihat shadow)
   - ✅ Dropdown menu (notice border dan shadow)
   - ✅ Checkbox (hover, focus, checked state)
   - ✅ Input fields (hover dan focus untuk lihat glow)
   - ✅ Table (hover rows untuk lihat highlight)

4. Ganti ke dark mode dan test lagi
5. Coba berbagai color schemes

## Benefits

1. **Konsistensi Visual**: Semua komponen menggunakan warna yang sama
2. **Better Feedback**: User mendapat feedback visual yang jelas saat interaksi
3. **Professional Look**: Glow effects dan shadows memberikan kesan modern
4. **Theme Awareness**: Setiap komponen terasa "hidup" dengan tema yang dipilih
5. **Accessibility**: Focus states yang jelas membantu keyboard navigation

## Notes

- Semua transition menggunakan `duration-200` untuk smooth animations
- Shadow menggunakan opacity 15-30% agar tidak terlalu mencolok
- Hover effects menggunakan opacity 50-70% untuk subtle changes
- Checked/active states menggunakan full opacity untuk clarity
