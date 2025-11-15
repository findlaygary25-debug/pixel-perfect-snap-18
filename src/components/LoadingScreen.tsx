import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted animate-fade-in">
      <div className="flex flex-col items-center gap-8">
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 animate-pulse opacity-50 blur-2xl">
            <img
              src="/favicon.png"
              alt="Voice2Fire"
              className="w-32 h-32 object-contain"
            />
          </div>
          <img
            src="/favicon.png"
            alt="Voice2Fire"
            className="w-32 h-32 object-contain relative z-10 animate-[pulse_2s_ease-in-out_infinite]"
          />
        </div>
        <div className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            Voice2Fire
          </h1>
          <p className="text-muted-foreground text-sm">Share Your Voice, Ignite Your Passion</p>
        </div>
      </div>
    </div>
  );
};
