'use client';

import React, { useEffect, useState } from 'react';

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 768 && !mediaQuery.matches) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Atmospheric Ambient Radial Background Glow */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#9ED8FF]/5 blur-[160px]" />
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-[#CFAE6E]/5 blur-[160px]" />

      {/* 2. Interactive Cursor Radial Glow Layer (Desktop only, if motion allowed) */}
      {!isMobile && !prefersReducedMotion && mousePos.x > 0 && (
        <div
          className="absolute h-[320px] w-[320px] rounded-full bg-[#F97316]/5 blur-[100px] transition-transform duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        />
      )}

      {/* 3. Moving Vertical Light Beams Traveling Along Architectural Grid Columns */}
      {!prefersReducedMotion && (
        <>
          <div className="light-beam" style={{ left: '16.66%', animationDelay: '0s' }} />
          <div className="light-beam" style={{ left: '41.66%', animationDelay: '4s' }} />
          <div className="light-beam" style={{ left: '66.66%', animationDelay: '8s' }} />
          <div className="light-beam" style={{ left: '83.33%', animationDelay: '2s' }} />
        </>
      )}
    </div>
  );
}
