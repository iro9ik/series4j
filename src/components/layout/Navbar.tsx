// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, Search, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // search state
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const profileContainerRef = useRef<HTMLDivElement | null>(null);

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) {
        setIsLoggedIn(false);
        setUsername(null);
        setAuthResolved(true);
        return;
      }
      const user = await res.json();
      setIsLoggedIn(true);
      setUsername(user.username ?? null);
      setAuthResolved(true);
    } catch (err) {
      console.error("Navbar: failed to load /api/auth/me", err);
      setIsLoggedIn(false);
      setUsername(null);
      setAuthResolved(true);
    }
  }

  useEffect(() => {
    loadMe();
    function onAuthChange() { loadMe(); }
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, []);

  useEffect(() => { loadMe(); }, [pathname]);

  useEffect(() => { if (desktopSearchOpen && desktopInputRef.current) desktopInputRef.current.focus(); }, [desktopSearchOpen]);
  useEffect(() => { if (mobileSearchOpen && mobileInputRef.current) mobileInputRef.current.focus(); }, [mobileSearchOpen]);

  // Click outside to close search and profile menu
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;

      // Close desktop search
      if (desktopSearchContainerRef.current && !desktopSearchContainerRef.current.contains(target)) {
        setDesktopSearchOpen(false);
      }

      // Close profile menu
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDesktopSearchOpen(false);
        setMobileSearchOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (err) { console.error("Logout failed", err); }
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  }

  function handleDesktopIconClick() { setDesktopSearchOpen((s) => !s); }
  function handleMobileIconClick() { setMobileSearchOpen(true); }
  function handleDesktopSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setDesktopSearchOpen(false); setMobileSearchOpen(false);
  }
  function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault(); const q = searchQuery.trim(); if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false); setDesktopSearchOpen(false);
  }

  const initials = username ? username.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center">
        {/* Logo - Left */}
        <Link href="/" className="text-2xl font-bold text-yellow-400 mr-auto">Series4J</Link>

        {/* Nav Links - Center */}
        <nav className="hidden md:flex gap-8 text-sm uppercase tracking-wide absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="hover:text-yellow-400 transition">Accueil</Link>
          <Link href="/series" className="hover:text-yellow-400 transition">Series</Link>
          {isLoggedIn && <Link href="/library" className="hover:text-yellow-400 transition">Library</Link>}
        </nav>

        {/* Right side - Search + Auth */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Desktop search */}
          <div ref={desktopSearchContainerRef} className="hidden md:flex items-center">
            <form onSubmit={handleDesktopSubmit} className="flex items-center">
              <div className={`flex items-center transition-all duration-300 ease-out overflow-hidden ${desktopSearchOpen ? "w-64 opacity-100 mr-2" : "w-0 opacity-0"}`}>
                <input
                  ref={desktopInputRef}
                  type="text"
                  placeholder="Search series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-black border-2 border-yellow-400 text-sm text-white placeholder-white/50 focus:outline-none"
                />
              </div>
              <button type="button" onClick={handleDesktopIconClick} aria-label={desktopSearchOpen ? "Close search" : "Open search"} className="w-10 h-10 rounded-lg bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition">
                {desktopSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Mobile search */}
          <div className="md:hidden">
            <button onClick={handleMobileIconClick} aria-label="Open search" className="w-10 h-10 rounded-lg bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition">
              <Search className="w-4 h-4" />
            </button>
            {mobileSearchOpen && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <form onSubmit={handleMobileSubmit} className="flex items-center gap-2">
                    <input ref={mobileInputRef} type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg bg-black border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none" />
                    <button type="submit" className="w-12 h-12 rounded-lg bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition" aria-label="Submit search"><Search className="w-5 h-5" /></button>
                    <button type="button" onClick={() => setMobileSearchOpen(false)} className="w-12 h-12 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"><X className="w-5 h-5" /></button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Auth / Profile */}
          {!authResolved ? (
            <div className="w-20 h-9" />
          ) : !isLoggedIn ? (
            <>
              <Link href="/login" className="px-4 py-2 rounded-lg border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-medium">Login</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition text-sm font-medium">Sign Up</Link>
            </>
          ) : (
            <div className="relative" ref={profileContainerRef}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition shadow-lg"
                  aria-label="User profile"
                >
                  <User className="w-5 h-5 text-white" />
                </button>

                {/* Name on the right of the icon */}
                <span className="hidden lg:block text-sm font-bold text-white/90 tracking-wide cursor-default">{username}</span>
              </div>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-40 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1">
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10 transition text-sm text-white/90">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
