import React, { useEffect, useRef, useState } from "react";

type EqBand = "low" | "mid" | "high";

export default function Voice2FirePlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<{
    low: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80); // 0–100
  const [eqValues, setEqValues] = useState({
    low: 0,
    mid: 0,
    high: 0,
  });
  const [isPro, setIsPro] = useState(true);

  // --- INIT WEB AUDIO + EQ FOR VIDEO ---
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;

    if (!AudioCtx) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    const ctx = new AudioCtx();
    const source = ctx.createMediaElementSource(video);

    const low = ctx.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 320;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1.0;

    const high = ctx.createBiquadFilter();
    high.type = "highshelf";
    high.frequency.value = 3200;

    // Connect: video -> low -> mid -> high -> speakers
    source.connect(low);
    low.connect(mid);
    mid.connect(high);
    high.connect(ctx.destination);

    filtersRef.current = { low, mid, high };
    audioCtxRef.current = ctx;

    return () => {
      ctx.close();
    };
  }, []);

  // --- SYNC VOLUME TO VIDEO ELEMENT ---
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
        if (audioCtxRef.current?.state === "suspended") {
          await audioCtxRef.current.resume();
        }
      } catch (err) {
        console.error("Play error:", err);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleEqChange = (band: EqBand, value: number) => {
    setEqValues((prev) => ({ ...prev, [band]: value }));
    if (filtersRef.current) {
      filtersRef.current[band].gain.value = value;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-slate-950 to-black text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide uppercase">
              Voice<span className="text-orange-500">2</span>Fire
            </h1>
            <p className="text-xs text-slate-400">
              9:16 video • bold • pro sound
            </p>
          </div>
          <button
            onClick={() => setIsPro((p) => !p)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isPro
                ? "bg-orange-500/10 border-orange-500 text-orange-300"
                : "border-slate-500 text-slate-300"
            } transition`}
          >
            {isPro ? "Pro mode ON" : "Pro mode OFF"}
          </button>
        </div>

        {/* 9:16 VIDEO SCREEN */}
        <div className="relative w-full mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[9/16] flex flex-col">
          {/* Top label */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              NOW PLAYING
            </span>
            <span className="text-[10px] text-slate-500">HTML5 • Video</span>
          </div>

          {/* Video area */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              src="/test-video-9-16.mp4"
              className="w-full h-full object-cover"
              playsInline
              onEnded={() => setIsPlaying(false)}
              controls={false}
            />
            {/* Play overlay when paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <span className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-black text-2xl font-bold shadow-xl active:scale-95 transition">
                  ▶
                </span>
              </button>
            )}
          </div>

          {/* CONTROLS */}
          <div className="border-t border-slate-800/80 bg-black/60 backdrop-blur-md px-4 py-3 space-y-3">
            {/* Play / pause & volume */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold shadow-lg active:scale-95 transition"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <div className="flex-1">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Volume</span>
                  <span>{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Equalizer (Pro) */}
            {isPro && (
              <div className="mt-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-[0.18em]">
                    Pro Equalizer
                  </span>
                  <span className="text-[10px] text-slate-500">
                    -12 dB to +12 dB
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {(["low", "mid", "high"] as EqBand[]).map((band) => (
                    <div key={band} className="space-y-1">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={eqValues[band]}
                        onChange={(e) =>
                          handleEqChange(band, Number(e.target.value))
                        }
                        className="w-full accent-orange-500"
                      />
                      <div className="text-[10px] uppercase text-slate-400">
                        {band === "low" && "Bass"}
                        {band === "mid" && "Mid"}
                        {band === "high" && "Treble"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>9:16 • MP4 • Smooth</span>
              <span className="font-semibold text-orange-400">
                Voice2Fire Pro
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
