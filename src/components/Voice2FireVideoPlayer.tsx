import React, { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

type EqBand = "low" | "mid" | "high";

export default function Voice2FireVideoPlayer() {
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- INIT WEB AUDIO + EQ, CONNECTED TO VIDEO ---
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;

    if (!AudioCtx) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    // Avoid double-wiring if React hot reloads
    if (audioCtxRef.current) return;

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
        if (audioCtxRef.current?.state === "suspended") {
          await audioCtxRef.current.resume();
        }
        await video.play();
        setIsPlaying(true);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice2fire-recording-${Date.now()}.webm`;
        a.click();
        setRecordedChunks([]);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-slate-900 to-black text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide uppercase">
              Voice<span className="text-orange-500">2</span>Fire
            </h1>
            <p className="text-xs text-slate-400">
              9:16 bold video • smooth • pro sound
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

        {/* 9:16 VIDEO SCREEN - Bigger viewing area */}
        <div className="relative w-full mx-auto rounded-3xl overflow-hidden shadow-2xl bg-slate-900 aspect-[9/16] flex flex-col" style={{ maxHeight: '75vh' }}>
          {/* Top label */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              NOW PLAYING
            </span>
            <span className="text-[10px] text-slate-500">HTML5 • Video</span>
          </div>

          {/* VIDEO AREA */}
          <div className="flex-1 px-3 pb-2">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src="/test-video-9-16.mp4"
                playsInline
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </div>

          {/* CONTROLS */}
          <div className="border-t border-slate-800/80 bg-black/60 backdrop-blur-md px-4 py-3 space-y-3">
            {/* Play / pause, record & volume */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold shadow-lg active:scale-95 transition-transform"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg active:scale-95 transition-all ${
                  isRecording 
                    ? "bg-red-500 animate-pulse" 
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {isRecording ? <Square className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
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

            {/* Equalizer (Pro only) */}
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

            {/* Footer info */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>MP4 • 9:16 • Smooth playback</span>
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
