import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("utubchat_visited");
    
    if (!hasVisited) {
      setShouldShow(true);
      setIsVisible(true);
      localStorage.setItem("utubchat_visited", "true");
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!shouldShow || !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted transition-opacity duration-500 ${
        isVisible ? "animate-fade-in opacity-100" : "animate-fade-out opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 -m-8 animate-[pulse_2s_ease-in-out_infinite] opacity-40 blur-3xl bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 rounded-full" />
          <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] opacity-30 blur-2xl">
            <img
              src="/favicon.png"
              alt="uTubChat"
              className="w-40 h-40 object-contain"
            />
          </div>
          <img
            src="/favicon.png"
            alt="uTubChat"
            className="w-40 h-40 object-contain relative z-10 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]"
          />
        </div>
        <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            uTubChat
          </h1>
          <p className="text-muted-foreground text-base">Share Your Voice, Ignite Your Passion</p>
        </div>
      </div>
    </div>
  );
};
