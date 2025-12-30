"use client";

import { useState } from "react";

export default function ProfileMenu({ user }: { user: { name: string } }) {
  const [open, setOpen] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        <img
          src="https://i.pravatar.cc/40"
          className="w-10 h-10 rounded-full"
          alt="profile"
        />
        <span className="text-sm">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
