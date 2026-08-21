'use client';

import { useState, useEffect } from 'react';

export default function UtcClock() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] text-[11px] mono-font text-[#B8C0CC]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#9ED8FF] animate-pulse" />
      <span className="text-[#F5F7FA] font-mono text-xs">{timeStr}</span>
    </div>
  );
}
