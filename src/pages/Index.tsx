import { useState } from "react";
import logo from "@/assets/voice2fire-logo-new.png";

const Index = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">

      {/* 🔶 MENU TOP LEFT */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute top-5 left-5 p-3 space-y-1.5 hover:bg-gray-200 rounded-md transition"
      >
        <div className="w-7 h-[3px] bg-black"></div>
        <div className="w-7 h-[3px] bg-black"></div>
        <div className="w-7 h-[3px] bg-black"></div>
      </button>

      {/* 🔶 CENTER CONTENT */}
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        
        <img
          src={logo}
          alt="Voice2Fire"
          className="w-56 mb-6 drop-shadow-md"
        />

        <p className="text-xl font-semibold text-gray-700 max-w-md leading-relaxed">
          Amplifying righteous voices — watch, pray, give thanks, and create.
        </p>
      </div>

      {/* 🔶 SLIDE MENU LEFT SIDE */}
      {open && (
        <div className="absolute top-0 left-0 w-64 h-full bg-white border-r border-gray-300 shadow-xl animate-slideIn">
          <div className="p-8 space-y-5">

            <h3 className="text-sm tracking-widest text-gray-500 uppercase">
              Menu
            </h3>

            <button className="block text-lg font-medium text-gray-800 hover:text-orange-600 hover:font-bold transition">
              Home
            </button>
            <button className="block text-lg font-medium text-gray-800 hover:text-orange-600 hover:font-bold transition">
              Discover
            </button>
            <button className="block text-lg font-medium text-gray-800 hover:text-orange-600 hover:font-bold transition">
              Create
            </button>
            <button className="block text-lg font-medium text-gray-800 hover:text-orange-600 hover:font-bold transition">
              Login / Profile
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
