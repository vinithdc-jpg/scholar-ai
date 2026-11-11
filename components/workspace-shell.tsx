"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  Bot,
  ChevronDown,
  CircleHelp,
  Command,
  Compass,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useSavedScholarships } from "@/components/saved-scholarships-provider";

function subscribeToTheme(callback: () => void) {
  window.addEventListener("scholarai-theme-change", callback);
  return () => window.removeEventListener("scholarai-theme-change", callback);
}

function getThemeSnapshot() {
  const savedMode = localStorage.getItem("scholarai-theme");
  return savedMode
    ? savedMode === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerThemeSnapshot() {
  return false;
}

const primaryNavigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discover scholarships", href: "/scholarships", icon: Compass },
  { label: "Saved scholarships", href: "/saved", icon: Bookmark },
  { label: "My applications", href: "/applications", icon: FileCheck2 },
  { label: "Eligibility checker", href: "/eligibility", icon: ShieldCheck },
  { label: "AI assistant", href: "/assistant", icon: Bot },
];

const accountNavigation = [
  { label: "My profile", href: "/profile", icon: UserRound },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

function NavigationLink({
  item,
  active,
  savedCount,
  onNavigate,
}: {
  item: (typeof primaryNavigation)[number];
  active: boolean;
  savedCount: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
        active
          ? "bg-[#d1fae5] text-[#047857]"
          : "workspace-muted text-[#70788d] hover:bg-[#f8fafc] hover:text-[#0f172a]"
      }`}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={active ? 2.2 : 1.8} />
      <span>{item.label}</span>
      {item.label === "Saved scholarships" && (
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] text-[#777d90]">
          {savedCount}
        </span>
      )}
    </Link>
  );
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { savedIds } = useSavedScholarships();
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  function toggleTheme() {
    const nextMode = !darkMode;
    localStorage.setItem("scholarai-theme", nextMode ? "dark" : "light");
    window.dispatchEvent(new Event("scholarai-theme-change"));
  }

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="workspace-canvas min-h-screen bg-[#f8fafc] dark:bg-[#10131d]">
      <div
        className={`fixed inset-0 z-40 bg-[#151a2a]/40 transition-opacity md:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside
        className={`workspace-surface fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#e2e8f0] bg-white px-4 pb-5 pt-6 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "visible translate-x-0" : "-translate-x-full invisible md:visible"
        }`}
      >
        <div className="mb-9 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMenu}>
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white shadow-md shadow-emerald-200">
              <GraduationCap size={21} strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.04em] text-[#21283e] dark:text-white">
              scholar<span className="text-[#059669]">ai</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-[#7c8396] hover:bg-[#f8fafc] md:hidden"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-[#d1fae5] bg-[#f0fdf4] p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#747b8f]">Profile strength</p>
            <span className="text-[11px] font-bold text-[#059669]">72%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#d1fae5]">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#059669] to-[#047857]" />
          </div>
          <Link href="/profile" onClick={closeMenu} className="mt-2 block text-[10px] font-semibold text-[#059669] hover:underline">
            Complete your profile <span aria-hidden="true">→</span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#a2a8b7]">
            Workspace
          </p>
          {primaryNavigation.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))}
              savedCount={savedIds.length}
              onNavigate={closeMenu}
            />
          ))}
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#a2a8b7]">
            Account
          </p>
          {accountNavigation.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              savedCount={savedIds.length}
              onNavigate={closeMenu}
            />
          ))}
          <Link
            href="/admin"
            onClick={closeMenu}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
              pathname === "/admin" ? "bg-[#d1fae5] text-[#047857]" : "text-[#70788d] hover:bg-[#f8fafc]"
            }`}
          >
            <Settings2 size={17} />
            Admin workspace
          </Link>
        </nav>

        <div className="mb-4 rounded-2xl border border-[#d1fae5] bg-gradient-to-br from-[#f0fdf4] to-white p-4">
          <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white text-[#059669] shadow-sm">
            <CircleHelp size={17} />
          </div>
          <p className="text-[12px] font-bold text-[#0f172a]">Need a little help?</p>
          <p className="mt-1 text-[11px] leading-5 text-[#777d94]">
            Our guide can help you find your next opportunity.
          </p>
          <Link href="/assistant" onClick={closeMenu} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] hover:underline">
            Ask ScholarAI <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 border-t border-[#e2e8f0] px-1 pt-4">
          <div className="grid size-9 place-items-center rounded-full bg-[#d1fae5] text-[12px] font-bold text-[#059669]">JD</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#0f172a] dark:text-white">Jordan Davis</p>
            <p className="truncate text-[10px] text-[#9198a9]">Student account</p>
          </div>
          <button type="button" className="rounded-lg p-1.5 text-[#858ca0] hover:bg-[#f8fafc]" aria-label="Account options">
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <header className="workspace-surface sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-[#e2e8f0] p-2 text-[#646b7e] md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <form action="/scholarships" role="search" className="relative hidden w-[min(360px,45vw)] sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a2a8b7]" />
              <input
                name="q"
                placeholder="Search scholarships, fields, schools..."
                aria-label="Search scholarships"
                className="workspace-input h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-9 pr-12 text-[12px] text-[#394057] outline-none placeholder:text-[#a0a6b5] focus:border-[#6ee7b7] focus:bg-white"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-[9px] text-[#9ba1b0]">
                <Command size={10} className="inline" /> K
              </kbd>
            </form>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-xl p-2 text-[#7d8497] transition hover:bg-[#f8fafc]"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/notifications" className="relative rounded-xl p-2 text-[#7d8497] transition hover:bg-[#f8fafc]" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-[#ee826e]" />
            </Link>
            <div className="hidden h-7 w-px bg-[#e2e8f0] sm:block" />
            <Link href="/profile" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-[#d1fae5] text-[11px] font-bold text-[#059669]">JD</span>
              <span className="hidden text-[12px] font-semibold text-[#0f172a] dark:text-white sm:block">Jordan Davis</span>
              <ChevronDown size={14} className="hidden text-[#a0a6b5] sm:block" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          {children}
          <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#e2e8f0] py-5 text-[10px] text-[#a0a6b4]">
            <span>© 2026 ScholarAI. Built for your next big step.</span>
            <span className="flex gap-4"><Link href="/scholarships" className="hover:text-[#059669]">Explore</Link><Link href="/assistant" className="hover:text-[#059669]">Help center</Link><Link href="/profile" className="hover:text-[#059669]">Privacy</Link></span>
          </footer>
        </main>
      </div>
    </div>
  );
}
