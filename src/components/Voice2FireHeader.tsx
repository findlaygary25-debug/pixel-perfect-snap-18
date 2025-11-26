import React, { useState } from "react";
import { Menu, PlusCircle, Mic, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Voice2FireHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* TOP HEADER / BANNER - FIRE ENHANCED */}
      <header className="fixed top-0 left-0 right-0 z-40 
        bg-black/70 backdrop-blur-xl border-b border-orange-500/40 shadow-[0_0_25px_rgba(255,140,0,0.45)]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-orange-500/10 before:to-transparent
        before:pointer-events-none
        overflow-hidden">
        
        {/* 🔥 Flame Band Animation */}
        <div className="absolute inset-x-0 -bottom-1 h-[3px] bg-gradient-to-r from-amber-500 via-red-600 to-orange-400 
          blur-sm animate-[fireline_2.5s_linear_infinite]"></div>
          
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 relative z-10">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-full bg-slate-900/80 border border-orange-500/60 
                shadow-[0_0_10px_rgba(255,120,0,0.55)] hover:shadow-[0_0_20px_rgba(255,150,0,0.9)]
                hover:bg-orange-600/20 active:scale-95 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-orange-300" />
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xl animate-[flicker_2s_infinite]" style={{ filter: "drop-shadow(0 0 8px orange)" }}>
                🔥
              </span>
              <span className="font-extrabold tracking-wide uppercase text-lg
                bg-gradient-to-r from-orange-300 via-yellow-300 to-red-500 bg-clip-text text-transparent
                drop-shadow-[0_0_8px_rgba(255,100,0,0.7)]">
                Voice<span className="text-orange-500">2</span>Fire
              </span>
            </div>
          </div>

          {/* Right: Create, Mic, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Create */}
            <button
              onClick={() => navigate("/upload")}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-br from-orange-400 to-red-600
                text-black font-bold shadow-[0_0_12px_rgba(255,120,0,0.9)] hover:shadow-[0_0_18px_rgba(255,150,0,1)]
                active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create</span>
            </button>

            {/* Mic */}
            <button
              onClick={() => navigate("/live")}
              className="p-2 rounded-full border border-orange-500/70 bg-black/60
                shadow-[0_0_10px_rgba(255,120,0,0.75)] hover:bg-orange-700/30 hover:shadow-[0_0_20px_rgba(255,170,0,1)]
                active:scale-95 transition"
              aria-label="Record voice"
            >
              <Mic className="w-4 h-4 text-orange-300" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate("/activity")}
              className="relative p-2 rounded-full border border-orange-500/70 bg-black/60
                shadow-[0_0_10px_rgba(255,120,0,0.75)] hover:bg-orange-700/30 hover:shadow-[0_0_20px_rgba(255,170,0,1)]
                active:scale-95 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-orange-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_red]" />
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full border border-orange-500/50
                bg-gradient-to-br from-slate-800 to-black
                shadow-[0_0_10px_rgba(255,120,0,0.65)] hover:shadow-[0_0_18px_rgba(255,170,0,1)]
                active:scale-95 transition flex items-center justify-center"
              aria-label="Profile"
            >
              <User className="w-4 h-4 text-orange-200" />
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
