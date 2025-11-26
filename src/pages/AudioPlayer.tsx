import Voice2FireHeader from "@/components/Voice2FireHeader";
import Voice2FirePlayer from "@/components/Voice2FirePlayer";

export default function AudioPlayer() {
  return (
    <div className="min-h-screen bg-black text-slate-50">
      <Voice2FireHeader />
      <main className="pt-16 flex items-center justify-center">
        <Voice2FirePlayer />
      </main>
    </div>
  );
}
