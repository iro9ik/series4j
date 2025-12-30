"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      window.location.href = "/";
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
            placeholder="Email"
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
