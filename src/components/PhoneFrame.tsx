import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, ShieldAlert } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-0 sm:p-4 md:p-6 selection:bg-orange-500 selection:text-white font-sans antialiased">
      {/* Mobile Frame Outer Chassis */}
      <div className="w-full max-w-[440px] h-[100vh] sm:h-[880px] bg-neutral-900 sm:rounded-[48px] shadow-2xl shadow-black/80 border-0 sm:border-[8px] border-neutral-800 flex flex-col overflow-hidden relative sm:ring-1 sm:ring-white/10">
        
        {/* Phone Notch & Status Bar */}
        <div className="bg-neutral-950/90 backdrop-blur-md text-neutral-300 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold select-none z-50 shrink-0 border-b border-neutral-800/60">
          <span className="tracking-tight text-neutral-200 font-mono text-[11px]">{timeStr || '12:00'}</span>
          
          {/* Dynamic Island / Punchhole notch */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-neutral-900/90 rounded-full border border-neutral-800 shadow-inner">
            <ShieldAlert className="w-3 h-3 text-orange-500 animate-pulse" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-black">ROAD SAHAYAK</span>
          </div>

          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5 text-neutral-300" />
            <Wifi className="w-3.5 h-3.5 text-neutral-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-neutral-400">98%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Main App Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-950">
          {children}
        </div>

        {/* Bottom Home Indicator Line */}
        <div className="bg-neutral-950 pt-1.5 pb-2.5 flex justify-center shrink-0 border-t border-neutral-900 select-none z-50">
          <div className="w-32 h-1 bg-neutral-700/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
