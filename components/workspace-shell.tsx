"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  Bell,
  Bookmark,
  Bot,
  ChevronDown,
  Command,
  Compass,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
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
import { getUserRole, logoutUser, type AppRole } from "@/lib/auth";
import { auth } from "@/lib/firebase";

const WorkspaceRoleContext = createContext<{
  role: AppRole | null;
  isRoleLoading: boolean;
}>({ role: null, isRoleLoading: true });

export function useWorkspaceRole() {
  return useContext(WorkspaceRoleContext);
}

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
          ? "bg-[#6366f1] text-white"
          : "text-indigo-100 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={active ? 2.2 : 1.8} />
      <span>{item.label}</span>
      {item.label === "Saved scholarships" && (
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-indigo-100">
          {savedCount}
        </span>
      )}
    </Link>
  );
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [role, setRole] = useState<AppRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");
  const { savedIds } = useSavedScholarships();
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setIsRoleLoading(true);
        setRole(null);
        setRoleError("");

        if (!user) {
          setRole(null);
          setIsRoleLoading(false);
          router.replace("/login");
          return;
        }

        getUserRole(user)
          .then((userRole) => {
            if (!active) return;
            setRole(userRole);
            setIsRoleLoading(false);
          })
          .catch((error: unknown) => {
            if (!active) return;
            setRole(null);
            setRoleError(
              error instanceof Error
                ? error.message
                : "Unable to verify your account role.",
            );
            setIsRoleLoading(false);
          });
      },
      (error) => {
        if (!active) return;
        setRole(null);
        setRoleError(error.message);
        setIsRoleLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (isRoleLoading || pathname !== "/admin") return;
    if (role === "student") router.replace("/dashboard");
  }, [isRoleLoading, pathname, role, router]);

  function toggleTheme() {
    const nextMode = !darkMode;
    localStorage.setItem("scholarai-theme", nextMode ? "dark" : "light");
    window.dispatchEvent(new Event("scholarai-theme-change"));
  }

  const closeMenu = () => setMobileMenuOpen(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logoutUser();
      router.replace("/login");
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <WorkspaceRoleContext.Provider value={{ role, isRoleLoading }}>
      <div className="workspace-canvas min-h-screen bg-[#f5f3ff] dark:bg-[#10131d]">
      <div
        className={`fixed inset-0 z-40 bg-[#151a2a]/40 transition-opacity md:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-65 flex-col border-r border-white/10 bg-[#312e81] px-4 pb-5 pt-6 text-white transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "visible translate-x-0" : "-translate-x-full invisible md:visible"
        }`}
      >
        <div className="mb-9 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMenu}>
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#6366f1] to-[#312e81] text-white shadow-md shadow-indigo-200">
              <GraduationCap size={21} strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.04em] text-white">
              scholar<span className="text-[#6366f1]">ai</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-indigo-100 hover:bg-white/10 md:hidden"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-white/15 bg-white/10 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-indigo-100">Profile strength</p>
            <span className="text-[11px] font-bold text-amber-400">72%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[72%] rounded-full bg-linear-to-r from-[#6366f1] to-amber-400" />
          </div>
          <Link href="/profile" onClick={closeMenu} className="mt-2 block text-[10px] font-semibold text-indigo-200 hover:underline">
            Complete your profile <span aria-hidden="true">→</span>
          </Link>
        </div>

        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto"
        >
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-200">
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
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-200">
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
          {role === "content_admin" || role === "super_admin" ? (
            <Link
              href="/admin"
              onClick={closeMenu}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-[#6366f1] text-white"
                  : "text-indigo-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings2 size={17} />
              Admin workspace
            </Link>
          ) : null}
        </nav>

        {logoutError && (
          <p className="mt-3 px-1 text-xs text-rose-200" role="alert">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-indigo-100 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut aria-hidden="true" size={17} />
          {isLoggingOut ? "Signing out…" : "Log out"}
        </button>
      </aside>

      <div className="md:pl-65">
        <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-[#4338ca] bg-[#312e81]/95 px-4 text-white backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-white/15 p-2 text-indigo-100 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <form action="/scholarships" role="search" className="relative hidden w-[min(360px,45vw)] sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200" />
              <input
                name="q"
                placeholder="Search scholarships, fields, schools..."
                aria-label="Search scholarships"
                className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-12 text-[12px] text-white outline-none placeholder:text-indigo-200 focus:border-indigo-300 focus:bg-white/15"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] text-indigo-100">
                <Command size={10} className="inline" /> K
              </kbd>
            </form>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-xl p-2 text-indigo-100 transition hover:bg-white/10"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/notifications" className="relative rounded-xl p-2 text-indigo-100 transition hover:bg-white/10" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-[#312e81] bg-[#f59e0b]" />
            </Link>
            <div className="hidden h-7 w-px bg-white/20 sm:block" />
            <Link href="/profile" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-white/15 text-[11px] font-bold text-white">JD</span>
              <span className="hidden text-[12px] font-semibold text-white sm:block">Jordan Davis</span>
              <ChevronDown size={14} className="hidden text-indigo-200 sm:block" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-375 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          {roleError && (
            <p className="text-sm text-rose-600" role="alert">
              {roleError}
            </p>
          )}
          {children}
          <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#ddd6fe] py-5 text-[10px] text-[#a0a6b4]">
            <span>© 2026 ScholarAI. Built for your next big step.</span>
            <span className="flex gap-4"><Link href="/scholarships" className="hover:text-[#6366f1]">Explore</Link><Link href="/assistant" className="hover:text-[#6366f1]">Help center</Link><Link href="/profile" className="hover:text-[#6366f1]">Privacy</Link></span>
          </footer>
        </main>
      </div>
      </div>
    </WorkspaceRoleContext.Provider>
  );
}
