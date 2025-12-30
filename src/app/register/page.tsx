"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      window.location.href = "/login";
    } else {
      alert("Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-black-900/90 p-10 rounded-2xl shadow-xl w-96">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
          Create Account
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <input
            placeholder="Email"
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Username"
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-black-800 border border-white/20 focus:border-yellow-400 outline-none transition"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="w-full py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition">
            Register
          </button>
        </form>

        <p className="text-white/70 text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
