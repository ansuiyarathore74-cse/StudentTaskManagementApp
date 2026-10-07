import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Menu,
  X,
  GraduationCap as Logo,
} from 'lucide-react';
import { type Page, navigate } from '@/lib/router';

type NavItem = { page: Page; label: string; icon: typeof LayoutDashboard };

const navItems: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'students', label: 'Students', icon: Users },
  { page: 'courses', label: 'Courses', icon: GraduationCap },
  { page: 'subjects', label: 'Subjects', icon: BookOpen },
  { page: 'tasks', label: 'Tasks', icon: CheckSquare },
];

export function Layout({
  currentPage,
  children,
}: {
  currentPage: Page;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: Page) => {
    navigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col fixed inset-y-0">
        <SidebarContent currentPage={currentPage} onNav={handleNav} />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white border-r border-slate-200 flex flex-col animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent currentPage={currentPage} onNav={handleNav} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-slate-800">
                {navItems.find((n) => n.page === currentPage)?.label ?? 'College Admin'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                System Online
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  currentPage,
  onNav,
}: {
  currentPage: Page;
  onNav: (page: Page) => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
            <Logo className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">College Admin</p>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNav(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">College Administration v1.0</p>
        <p className="text-xs text-slate-300 mt-0.5">© 2026 All rights reserved</p>
      </div>
    </>
  );
}
