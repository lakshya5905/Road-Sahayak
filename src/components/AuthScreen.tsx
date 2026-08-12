import React, { useState } from 'react';
import { ShieldAlert, Navigation, PhoneCall, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthScreenProps {
  onDemoSignIn: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onDemoSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      // If popup blocked or cancelled, present friendly error message
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed. Please try again or test in Demo Mode.');
      } else {
        setError(err.message || 'Unable to sign in with Google. You can try Demo Mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 p-6 flex flex-col justify-between overflow-y-auto relative selection:bg-orange-500 selection:text-white">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-orange-600/25 via-red-600/15 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="mt-6 text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-orange-500 p-1 mx-auto shadow-2xl shadow-red-600/40 flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-neutral-950 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-orange-500 animate-pulse" />
          </div>
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-tight text-white uppercase">
          ROAD <span className="text-orange-500">SAHAYAK</span>
        </h1>
        <p className="text-xs text-neutral-400 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
          Community-driven road safety & emergency help network
        </p>
      </div>

      {/* Value Pillars Cards */}
      <div className="space-y-3 my-6 relative z-10">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Instant SOS Broadcast</h3>
            <p className="text-[11px] text-neutral-400">Alert nearby motorists & first responders in 1-tap</p>
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Live Helper Radar</h3>
            <p className="text-[11px] text-neutral-400">Track active community helpers & live GPS routes</p>
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Verified Assistance</h3>
            <p className="text-[11px] text-neutral-400">Accident, breakdown, fuel, tire & medical aid</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 text-center relative z-10">
          {error}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-3 relative z-10">
        {/* Google Sign-In Primary Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white text-neutral-950 font-black text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-neutral-100 active:scale-95 transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.23v3.15C3.25 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.23C.44 8.15 0 9.98 0 12s.44 3.85 1.23 5.42l4.05-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.23 6.58l4.05 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>

        {/* Guest Demo Preview Button */}
        <button
          onClick={onDemoSignIn}
          className="w-full py-3 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <span>Explore Preview Mode</span>
          <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
        </button>

        <p className="text-[10px] text-neutral-500 text-center">
          By continuing, you agree to enable location services for emergency helper radar dispatch.
        </p>
      </div>
    </div>
  );
};
