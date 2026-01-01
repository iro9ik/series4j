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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadMe(); }, [pathname]);

  useEffect(() => { if (desktopSearchOpen && desktopInputRef.current) desktopInputRef.current.focus(); }, [desktopSearchOpen]);
  useEffect(() => { if (mobileSearchOpen && mobileInputRef.current) mobileInputRef.current.focus(); }, [mobileSearchOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!desktopSearchContainerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!desktopSearchContainerRef.current.contains(e.target)) setDesktopSearchOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-yellow-400">Series4J</Link>

        <nav className="hidden md:flex gap-10 text-sm uppercase tracking-wide">
          <Link href="/" className="hover:text-yellow-400 transition">Accueil</Link>
          <Link href="/series" className="hover:text-yellow-400 transition">Series</Link>
          {isLoggedIn && <Link href="/mylist" className="hover:text-yellow-400 transition">Library</Link>}
        </nav>

        <div className="relative flex items-center gap-4">
          {/* Desktop search */}
          <div ref={desktopSearchContainerRef} className="hidden md:flex items-center gap-2">
            <form onSubmit={handleDesktopSubmit} className="flex items-center">
              <div className={`flex items-center transition-all duration-300 ease-out overflow-hidden ${desktopSearchOpen ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
                <input ref={desktopInputRef} type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gradient-to-b from-white/6 to-white/3 border border-white/10 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow" />
              </div>
              <button type="button" onClick={handleDesktopIconClick} aria-label={desktopSearchOpen ? "Close search" : "Open search"} className="ml-2 w-10 h-10 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition">
                {desktopSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* mobile search */}
          <div className="md:hidden">
            <button onClick={handleMobileIconClick} aria-label="Open search" className="w-10 h-10 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition">
              <Search className="w-4 h-4" />
            </button>
            {mobileSearchOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <form onSubmit={handleMobileSubmit} className="flex items-center gap-2">
                    <input ref={mobileInputRef} type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow" />
                    <button type="submit" className="w-12 h-12 rounded-md bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 transition" aria-label="Submit search"><Search className="w-5 h-5" /></button>
                    <button type="button" onClick={() => setMobileSearchOpen(false)} className="ml-2 w-12 h-12 rounded-md bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* auth / profile */}
          {!authResolved ? (
            // placeholder avoids flash; keeps space similar
            <div className="w-[220px] h-10" />
          ) : !isLoggedIn ? (
            <>
              <Link href="/login" className="px-5 py-2 rounded-lg border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition font-semibold">Login</Link>
              <Link href="/register" className="px-5 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition font-semibold">Sign Up</Link>
            </>
          ) : (
            <>
              <button onClick={() => setProfileOpen((p) => !p)} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><User className="w-6 h-6" /></div>
                <span className="text-sm text-white/80">{username ?? "Profile"}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-14 w-40 bg-black border border-white/10 rounded-lg shadow-lg overflow-hidden">
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/10 transition text-sm"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
