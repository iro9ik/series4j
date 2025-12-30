"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");

    if (token) {
      setIsLoggedIn(true);
      setUsername(name);
    }
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
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

        {/* AUTH / PROFILE */}
        <div className="relative flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              {/* LOGIN – secondary */}
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg border border-yellow-400
                           text-yellow-400 hover:bg-yellow-400 hover:text-black
                           transition font-semibold"
              >
                Login
              </Link>

              {/* SIGNUP – primary */}
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
              {/* PROFILE */}
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-sm text-white/80">
                  {username}
                </span>
              </button>

              {/* DROPDOWN */}
              {open && (
                <div className="absolute right-0 top-14 w-40 bg-black border border-white/10 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3
                               hover:bg-white/10 transition text-sm"
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
