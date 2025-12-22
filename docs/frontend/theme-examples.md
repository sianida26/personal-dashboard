# Theme System Examples

Contoh-contoh praktis menggunakan sistem tema.

## Example 1: Dashboard Page dengan Teal Theme

```tsx
// apps/frontend/src/routes/dashboard.tsx
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body-lg mt-1">Welcome back!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-hover p-6">
          <h3 className="text-body-sm uppercase tracking-wide text-muted-foreground">
            Total Users
          </h3>
          <p className="text-h2 mt-2 text-brand">1,234</p>
          <span className="badge badge-primary mt-2">+12%</span>
        </div>

        <div className="card-hover p-6">
          <h3 className="text-body-sm uppercase tracking-wide text-muted-foreground">
            Active Sessions
          </h3>
          <p className="text-h2 mt-2">456</p>
          <span className="badge badge-secondary mt-2">Active</span>
        </div>

        <div className="card-hover p-6">
          <h3 className="text-body-sm uppercase tracking-wide text-muted-foreground">
            Revenue
          </h3>
          <p className="text-h2 mt-2">$12,345</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="btn-primary">
          Create New
        </button>
        <button className="btn-secondary">
          Export Data
        </button>
        <button className="btn-ghost">
          Settings
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="card-hover">
        <div className="p-6 border-b">
          <h2 className="text-h3">Recent Activities</h2>
        </div>
        <div className="scrollable h-96 p-6">
          {/* Scrollbar will follow theme colors */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="py-2 border-b">
              Activity item {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Example 2: Settings Page dengan Yellow Theme

```tsx
// apps/frontend/src/routes/settings.tsx
import { useState } from "react";
import { ThemeSettings } from "@/components/ThemeSettings";
import { TbPalette, TbUser, TbBell } from "react-icons/tb";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-h1 mb-6">Settings</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`sidebar-menu-button w-full ${
                  activeTab === "general" ? "active" : ""
                }`}
              >
                <TbUser className="sidebar-menu-icon" />
                <span>General</span>
              </button>
              
              <button
                onClick={() => setActiveTab("appearance")}
                className={`sidebar-menu-button w-full ${
                  activeTab === "appearance" ? "active" : ""
                }`}
              >
                <TbPalette className="sidebar-menu-icon" />
                <span>Appearance</span>
              </button>
              
              <button
                onClick={() => setActiveTab("notifications")}
                className={`sidebar-menu-button w-full ${
                  activeTab === "notifications" ? "active" : ""
                }`}
              >
                <TbBell className="sidebar-menu-icon" />
                <span>Notifications</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="col-span-9">
            {activeTab === "appearance" && (
              <div className="card-hover p-6">
                <h2 className="text-h2 mb-4">Appearance</h2>
                <p className="text-body-md mb-6">
                  Customize how your dashboard looks
                </p>

                <ThemeSettings />

                <div className="mt-6 p-4 alert alert-info">
                  <p className="text-sm">
                    Changes are automatically saved and synced across all your devices
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Example 3: Table dengan Theme

```tsx
// apps/frontend/src/components/UsersTable.tsx
export function UsersTable() {
  return (
    <div className="card-hover overflow-hidden">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-head">Name</th>
            <th className="table-head">Email</th>
            <th className="table-head">Status</th>
            <th className="table-head">Actions</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {users.map((user) => (
            <tr key={user.id} className="table-row">
              <td className="table-cell font-medium">{user.name}</td>
              <td className="table-cell">{user.email}</td>
              <td className="table-cell">
                <span className="badge badge-primary">Active</span>
              </td>
              <td className="table-cell">
                <button className="btn-ghost">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Example 4: Alert Messages

```tsx
export function AlertExamples() {
  return (
    <div className="space-y-4">
      <div className="alert alert-success">
        <p className="font-medium">Success!</p>
        <p className="text-sm">Your changes have been saved.</p>
      </div>

      <div className="alert alert-destructive">
        <p className="font-medium">Error!</p>
        <p className="text-sm">Something went wrong. Please try again.</p>
      </div>

      <div className="alert alert-info">
        <p className="font-medium">Info</p>
        <p className="text-sm">This action cannot be undone.</p>
      </div>
    </div>
  );
}
```

## Example 5: Custom Styled Elements

```tsx
export function CustomCard() {
  return (
    <div 
      className="rounded-xl p-6 text-white"
      style={{
        background: 'var(--primary-gradient)',
        boxShadow: 'var(--shadow-brand)',
      }}
    >
      <h3 className="text-h3 mb-2">Premium Feature</h3>
      <p className="text-sm opacity-90">
        Unlock advanced analytics and insights
      </p>
      <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
        Learn More
      </button>
    </div>
  );
}
```

## Example 6: Sidebar dengan Dropdown Theme

```tsx
import { ThemeSettings } from "@/components/ThemeSettings";
import { TbPalette } from "react-icons/tb";

export function AppSidebar() {
  return (
    <aside className="sidebar-elegant w-64 h-screen flex flex-col">
      {/* Header */}
      <div className="sidebar-header">
        <img src="/logo.svg" alt="Logo" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollable px-3">
        <div className="sidebar-group-label">Main</div>
        
        <Link to="/dashboard" className="sidebar-menu-button active">
          <TbHome className="sidebar-menu-icon" />
          <span>Dashboard</span>
        </Link>
        
        {/* More nav items... */}

        <div className="sidebar-group-label mt-6">Settings</div>
        
        {/* Theme Settings as dropdown item */}
        <ThemeSettings>
          <TbPalette className="sidebar-menu-icon" />
          <span>Theme</span>
        </ThemeSettings>
      </nav>

      {/* User Card */}
      <div className="p-3">
        <button className="sidebar-user-card">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar />
              <span className="sidebar-avatar-status" />
            </div>
            <div className="flex-1 text-left">
              <div className="sidebar-user-name">John Doe</div>
              <div className="sidebar-user-email">john@example.com</div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
```

## Example 7: Form dengan Theme

```tsx
export function UserForm() {
  return (
    <form className="card-hover p-6 space-y-4">
      <div>
        <label className="form-label">Name</label>
        <input 
          type="text" 
          className="input-primary mt-1" 
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label className="form-label">Email</label>
        <input 
          type="email" 
          className="input-primary mt-1" 
          placeholder="Enter your email"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Save Changes
        </button>
        <button type="button" className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## Example 8: Responsive Grid dengan Cards

```tsx
export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="card-hover overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-h3">{product.name}</h3>
            <p className="text-body-md mt-2">{product.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-brand font-bold text-lg">
                ${product.price}
              </span>
              <button className="btn-primary">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Testing Different Themes

Untuk test semua themes, gunakan ThemeSettings component:

```tsx
import { ThemeSettings } from "@/components/ThemeSettings";

// Test dengan berbagai color schemes:
// - default (gray)
// - blue
// - purple
// - green
// - orange
// - red
// - pink
// - teal (cyan-like)
// - yellow (amber)
// - cyan
// - indigo
// - rose
```

Setiap theme akan secara otomatis mengubah:
- Primary colors
- Gradients
- Shadows
- Scrollbar colors
- Button styles
- Card hover effects
- Badge colors
- Alert colors

## Tips

1. **Konsistensi**: Gunakan helper classes (`btn-primary`, `card-hover`, dll) untuk konsistensi
2. **Scrollbar**: Tambahkan class `scrollable` untuk area yang bisa di-scroll
3. **Custom Colors**: Gunakan CSS variables (`var(--primary)`, `var(--primary-gradient)`) untuk custom styling
4. **Accessibility**: Test di light dan dark mode untuk setiap color scheme
5. **Performance**: Theme switching instant karena menggunakan CSS variables
