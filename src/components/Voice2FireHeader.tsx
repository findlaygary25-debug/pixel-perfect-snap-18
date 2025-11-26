import React, { useState } from "react";
import { Menu, PlusCircle, Mic, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Voice2FireHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* TOP HEADER / BANNER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/70 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 active:scale-95 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-slate-100" />
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xl">🔥</span>
              <span className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                Voice<span className="text-orange-500">2</span>Fire
              </span>
            </div>
          </div>

          {/* Right: Create, Mic, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Create */}
            <button
              onClick={() => navigate("/upload")}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500 text-black text-xs font-semibold shadow-md hover:bg-orange-400 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create</span>
            </button>

            {/* Mic */}
            <button
              onClick={() => navigate("/live")}
              className="p-2 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 active:scale-95 transition"
              aria-label="Record voice"
            >
              <Mic className="w-4 h-4 text-slate-100" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate("/activity")}
              className="relative p-2 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 active:scale-95 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-100" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-[10px] font-bold uppercase tracking-wide hover:from-slate-600 hover:to-slate-900 active:scale-95 transition"
              aria-label="Profile"
            >
              <User className="w-4 h-4 text-slate-100" />
            </button>
          </div>
        </div>
      </header>

      {/* SIDE MENU / DRAWER FROM HAMBURGER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Dim background */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-64 max-w-[70%] bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold uppercase tracking-wide">
                  Voice<span className="text-orange-500">2</span>Fire
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                Close
              </button>
            </div>

            <nav className="flex-1 py-3 text-sm">
              <button 
                onClick={() => { navigate("/"); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900 text-slate-100"
              >
                Home
              </button>
              <button 
                onClick={() => { navigate("/feed"); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900 text-slate-100"
              >
                Discover
              </button>
              <button 
                onClick={() => { navigate("/collections"); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900 text-slate-100"
              >
                My Fire (Library)
              </button>
              <button 
                onClick={() => { navigate("/scheduled"); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900 text-slate-100"
              >
                Drafts
              </button>
              <button 
                onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-900 text-slate-100"
              >
                Settings
              </button>
            </nav>

            <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
              Voice2Fire Pro • Bold Sound, Pure Flame
            </div>
          </div>
        </div>
      )}
    </>
  );
}
