import { useState, type ReactNode } from 'react';
import {
  Home,
  Search,
  Navigation,
  LayoutDashboard,
  Library,
  Menu,
  Radio,
  GraduationCap,
  BookMarked,
  LogOut,
  Map as MapIcon,
} from 'lucide-react';
import type { PageId, Role, User } from '../types';

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof Home;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, roles: ['student', 'librarian'] },
  { id: 'search', label: 'Book Search', icon: Search, roles: ['student', 'librarian'] },
  { id: 'navigation', label: 'Library Navigation', icon: Navigation, roles: ['student', 'librarian'] },
  { id: 'dashboard', label: 'Librarian Dashboard', icon: LayoutDashboard, roles: ['librarian'] },
  { id: 'mapeditor', label: 'Map Editor', icon: MapIcon, roles: ['librarian'] },
];

type Props = {
  current: PageId;
  onNavigate: (page: PageId) => void;
  user: User;
  onLogout: () => void;
  children: ReactNode;
};

export default function Layout({ current, onNavigate, user, onLogout, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || (user.role !== 'student' && user.role !== 'librarian')) {
    return null;
  }

  const go = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-navy-900 text-white fixed inset-y-0 left-0 z-30">
        <SidebarContent
          current={current}
          onNavigate={go}
          user={user}
          onLogout={onLogout}
          items={items}
        />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-navy-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy-900 text-white flex flex-col animate-fade-in">
            <SidebarContent
              current={current}
              onNavigate={go}
              user={user}
              onLogout={onLogout}
              items={items}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-navy-900 text-white px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-400 flex items-center justify-center">
              <Library className="w-5 h-5 text-navy-900" />
            </div>
            <span className="font-display font-bold text-lg">BookBeacon</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  current,
  onNavigate,
  user,
  onLogout,
  items,
}: {
  current: PageId;
  onNavigate: (p: PageId) => void;
  user: User;
  onLogout: () => void;
  items: NavItem[];
}) {
  if (!user || (user.role !== 'student' && user.role !== 'librarian')) {
    return null;
  }

  return (
    <>
      <div className="px-6 py-6 flex items-center gap-3 border-b border-navy-800">
        <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/20">
          <Library className="w-6 h-6 text-navy-900" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-xl leading-none">
            BookBeacon
          </h1>
          <p className="text-xs text-navy-300 mt-1">Smart Library System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
          Menu
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-cyan-400 text-navy-900 shadow-lg shadow-cyan-400/10'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-navy-800 space-y-4">
        <div className="rounded-xl bg-navy-800/60 p-4 border border-navy-700">
          <div className="flex items-center gap-2 text-cyan-300 mb-2">
            <Radio className="w-4 h-4 animate-spin-slow" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Beacon Active
            </span>
          </div>
          <p className="text-xs text-navy-300 leading-relaxed">
            Simulated indoor positioning for shelf-level guidance.
          </p>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
            {user.role === 'student' ? (
              <GraduationCap className="w-5 h-5 text-cyan-300" />
            ) : (
              <BookMarked className="w-5 h-5 text-cyan-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-navy-400 capitalize">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-navy-300 hover:bg-navy-800 hover:text-white transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
