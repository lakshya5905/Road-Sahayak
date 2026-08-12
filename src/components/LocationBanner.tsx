import React from 'react';
import { MapPinOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface LocationBannerProps {
  status: 'denied' | 'unsupported' | 'error';
  errorMessage?: string;
  onRetry: () => void;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  status,
  errorMessage,
  onRetry
}) => {
  return (
    <div className="bg-gradient-to-r from-red-900/90 to-amber-900/90 border-b border-red-700/50 px-4 py-3 text-red-100 flex items-center justify-between gap-3 text-xs z-30 shadow-md">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-400">
          <MapPinOff className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <p className="font-bold text-white flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" /> Location Required
          </p>
          <p className="text-[11px] text-red-200/90 leading-tight mt-0.5">
            {status === 'denied'
              ? 'Road Sahayak needs location access to alert nearby helpers & report SOS.'
              : errorMessage || 'Unable to detect live coordinates.'}
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow flex items-center gap-1 shrink-0 active:scale-95 transition"
      >
        <RefreshCw className="w-3 h-3" />
        Enable
      </button>
    </div>
  );
};
