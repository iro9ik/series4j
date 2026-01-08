"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const username = data?.user?.username ?? "";
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);

        if (data?.hasGenres === false) {
          localStorage.setItem("showSetup", "true");
        }

        window.dispatchEvent(new Event("auth-change"));
        router.push("/");
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-black/80 backdrop-blur-xl border border-yellow-400/20 rounded-3xl p-8 shadow-2xl shadow-yellow-400/5">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-white/50 text-center mb-8 text-sm">
            Sign in to continue to Series4J
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">Username</label>
              <input
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-400/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-semibold transition">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
