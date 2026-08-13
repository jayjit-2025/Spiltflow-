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
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080808] border border-[rgba(232,237,242,0.06)] text-[11px] mono-font text-[#8A8F96]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#E8EDF2] animate-pulse" />
      <span className="text-[#E8EDF2] doto-font text-xs">{timeStr}</span>
    </div>
  );
}
