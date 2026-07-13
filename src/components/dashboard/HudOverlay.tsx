import { useState, useEffect } from "react";

export default function HudOverlay() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-container">
      {/* Top HUD */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 items-center hud-text">
        <span>[ 00 / DASHBOARD ]</span>
        <span className="opacity-50">&lt; 1 &gt;</span>
        <span>[ 01 / PIPELINE ]</span>
        <span className="opacity-50">&lt; 2 &gt;</span>
        <span>[ 02 / ANALYSIS ]</span>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 items-center hud-text">
        <span>iVEST AI ENGINE</span>
        <span className="opacity-50">&lt; {time} &gt;</span>
        <span>SYSTEM_STATUS: ONLINE</span>
      </div>

      {/* Left HUD */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-8 items-center hud-text" style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}>
        <span>DATA_STREAM &lt; 1 &gt; ACTIVE</span>
        <span className="w-px h-8 bg-white/20"></span>
        <span>LATENCY: 12MS</span>
      </div>

      {/* Right HUD */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-8 items-center hud-text" style={{ writingMode: 'vertical-rl' }}>
        <span>MULTI_AGENT &lt; 8 &gt; CLUSTER</span>
        <span className="w-px h-8 bg-white/20"></span>
        <span>SECURE_CONNECTION</span>
      </div>
    </div>
  );
}
