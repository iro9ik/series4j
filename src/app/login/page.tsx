"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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

      // If server indicates the user doesn't have genres -> show setup after login
      if (data?.hasGenres === false) {
        // flag to make SetupWrapper show the popup immediately
        localStorage.setItem("showSetup", "true");
      }

      // notify other parts of the app about auth change (Navbar listens)
      window.dispatchEvent(new Event("auth-change"));

      router.push("/");
    } else {
      alert(data.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-black-900/90 p-10 rounded-2xl shadow-xl w-96 focus:border-yellow-400 outline-none transition">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
          Welcome Back
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
          />
          <button className="w-full py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition">
            Login
          </button>
        </form>

        <p className="text-white/70 text-center mt-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-yellow-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
