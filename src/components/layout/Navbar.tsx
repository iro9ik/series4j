// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, Search, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // refs
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null);

  // load logged-in user from server (uses cookie token)
  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setIsLoggedIn(false);
        setUsername(null);
        return;
      }
      const user = await res.json();
      setIsLoggedIn(true);
      setUsername(user.username ?? null);
    } catch (err) {
      console.error("Failed to load /api/auth/me", err);
      setIsLoggedIn(false);
      setUsername(null);
    }
  }

  // Run on mount: initialize auth, and listen for auth-change
  useEffect(() => {
    loadMe();

    function onAuthChange() {
      loadMe();
    }

    window.addEventListener("auth-change", onAuthChange);
    return () => {
      window.removeEventListener("auth-change", onAuthChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also refresh on pathname changes (client nav)
  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // focus desktop input when opened
  useEffect(() => {
    if (desktopSearchOpen && desktopInputRef.current) {
      desktopInputRef.current.focus();
    }
  }, [desktopSearchOpen]);

  // focus mobile input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // close desktop search when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!desktopSearchContainerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!desktopSearchContainerRef.current.contains(e.target)) {
        setDesktopSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // close searches on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDesktopSearchOpen(false);
        setMobileSearchOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    try {
      // call server to clear httpOnly cookie
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // notify other components to refresh auth
      window.dispatchEvent(new Event("auth-change"));
      // go to home
      router.push("/");
    }
  }

  function handleDesktopIconClick() {
    // toggles desktop search open/close
    setDesktopSearchOpen((s) => !s);
  }

  function handleMobileIconClick() {
    setMobileSearchOpen(true);
  }

  function handleDesktopSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      // if there's nothing typed, clicking icon toggles; do nothing on submit
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
  }

  function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-yellow-400">
          Series4J
        </Link>

        {/* TABS */}
        <nav className="hidden md:flex gap-10 text-sm uppercase tracking-wide">
          <Link href="/" className="hover:text-yellow-400 transition">
            Accueil
          </Link>
          <Link href="/series" className="hover:text-yellow-400 transition">
            Series
          </Link>
          {isLoggedIn && (
            <Link href="/mylist" className="hover:text-yellow-400 transition">
              Library
            </Link>
          )}
        </nav>

        {/* AUTH / PROFILE + SEARCH */}
        <div className="relative flex items-center gap-4">
          {/* DESKTOP SEARCH */}
          <div
            ref={desktopSearchContainerRef}
            className="hidden md:flex items-center gap-2"
          >
            <form onSubmit={handleDesktopSubmit} className="flex items-center">
              {/* Animated container: width and opacity */}
              <div
                className={`flex items-center transition-all duration-300 ease-out overflow-hidden
                  ${desktopSearchOpen ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}
              >
                <input
                  ref={desktopInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search"
                  className="w-full px-3 py-2 rounded-md bg-gradient-to-b from-white/6 to-white/3 border border-white/10 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
                />
              </div>

              {/* Icon: square, matches Login/Signup visual weight; toggles open/close */}
              <button
                type="button"
                onClick={handleDesktopIconClick}
                aria-label={desktopSearchOpen ? "Close search" : "Open search"}
                className="ml-2 w-10 h-10 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition"
              >
                {desktopSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* MOBILE SEARCH: overlay */}
          <div className="md:hidden">
            <button
              onClick={handleMobileIconClick}
              aria-label="Open search"
              className="w-10 h-10 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition"
            >
              <Search className="w-4 h-4" />
            </button>

            {mobileSearchOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <form onSubmit={handleMobileSubmit} className="flex items-center gap-2">
                    <input
                      ref={mobileInputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search"
                      className="flex-1 px-4 py-3 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition"
                      aria-label="Submit search"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileSearchOpen(false)}
                      className="ml-2 w-12 h-12 rounded-md bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition"
                      aria-label="Close search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* AUTH BUTTONS / PROFILE */}
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg border border-yellow-400
                           text-yellow-400 hover:bg-yellow-400 hover:text-black
                           transition font-semibold"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="px-5 py-2 rounded-lg bg-yellow-400 text-black
                           hover:bg-yellow-300 transition font-semibold"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-3"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-sm text-white/80">{username ?? "Profile"}</span>
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <div className="absolute right-0 top-14 w-40 bg-black border border-white/10 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/10 transition text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
