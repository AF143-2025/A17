import React from 'react';
import { Rocket } from 'lucide-react';

export default function HeroAnimatedLogo() {
  return (
    <div className="relative flex flex-col items-center justify-center my-2 select-none">
      {/* Outer ambient glow circles */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute w-48 h-48 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

      {/* Main orbital container */}
      <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
        
        {/* Outer rotating dashed ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30 animate-spin-slow pointer-events-none" />

        {/* Middle counter-rotating ring with gradient accent dots */}
        <div className="absolute inset-2 sm:inset-3 rounded-full border border-cyan-400/20 animate-spin-reverse-slow pointer-events-none">
          {/* Orbiting glowing dot 1 */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          {/* Orbiting glowing dot 2 */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
        </div>

        {/* Pulsing inner aura ring */}
        <div className="absolute inset-5 sm:inset-6 rounded-3xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-cyan-500/20 backdrop-blur-md border border-white/10 shadow-2xl animate-pulse-glow" />

        {/* Center Emblem Card */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] shadow-[0_0_35px_rgba(37,99,235,0.45)] group hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-[22px] bg-[#0A0F1D]/90 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Background subtle light beam */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            {/* Floating Rocket Icon with Exhaust Flare */}
            <div className="relative animate-float-slow">
              <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_4px_12px_rgba(56,189,248,0.6)]" />
              
              {/* Rocket propulsion flare */}
              <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-cyan-400 blur-[2px] animate-ping opacity-75" />
              <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full bg-blue-500 blur-sm opacity-90" />
            </div>

            {/* Micro label below rocket */}
            <span className="mt-1 text-[9px] sm:text-[10px] font-black tracking-widest text-cyan-300 font-sans uppercase">
              ESAAD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
