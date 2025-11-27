import { useState } from "react";
import logo from "@/assets/voice2fire-logo-new.png";

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-slate-950 to-black text-white">

      {/* 🔥 TOP RIGHT MENU BUTTON */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-5 right-5 space-y-1.5 p-3 rounded-lg border border-orange-500/60 bg-black/80 shadow-[0_0_12px_rgba(255,120,0,0.8)] hover:shadow-[0_0_22px_rgba(255,160,0,1)] active:scale-95 transition"
      >
        {/* 3 line selector */}
        <div className="w-6 h-0.5 bg-orange-400"></div>
        <div className="w-6 h-0.5 bg-orange-400"></div>
        <div className="w-6 h-0.5 bg-orange-400"></div>
      </button>

      {/* 🔥 CENTERED BRAND BLOCK */}
      <div className="text-center px-5">
        <img 
          src={logo}
          alt="Voice2Fire"
          className="w-64 h-auto mx-auto mb-6 drop-shadow-[0_0_25px_rgba(255,120,0,0.7)] animate-[pulse_3s_infinite]"
        />

        <h1 className="text-4xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-orange-300 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]">
          Voice<span className="text-orange-500">2</span>Fire
        </h1>

        <p className="text-xl text-slate-300 mt-3 font-semibold leading-relaxed drop-shadow">
          Amplifying righteous voices.  
          <br /> Watch — Pray — Give Thanks — Create.
        </p>
      </div>

      {/* 🔥 SLIDE-OUT MENU */}
      {menuOpen && (
        <div className="absolute top-0 right-0 h-full w-64 bg-black/90 border-l border-orange-500/40 shadow-[0_0_30px_rgba(255,120,0,0.7)] animate-[slideIn_0.3s_ease]">
          <div className="p-6 space-y-4 text-right">

            <h2 className="text-orange-400 text-sm font-bold tracking-[0.3em] uppercase mb-3">
              Menu
            </h2>

            <button className="block text-lg font-bold text-white hover:text-orange-400">
              Home
            </button>
            <button className="block text-lg font-bold text-white hover:text-orange-400">
              Discover
            </button>
            <button className="block text-lg font-bold text-white hover:text-orange-400">
              Create
            </button>
            <button className="block text-lg font-bold text-white hover:text-orange-400">
              Login / Profile
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
