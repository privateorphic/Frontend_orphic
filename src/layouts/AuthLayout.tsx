import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import logoImg from '../assets/orphicsolution_logo.jpg';

export default function AuthLayout() {
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #7C2D12 0%, #3B1A0C 55%, #1A0B05 100%)',
      }}
    >
      {/* Soft decorative blurred glow in top-left */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#EF7D35] opacity-25 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 p-2 border-[3px] border-[#EF7D35] shadow-[0_4px_20px_rgba(239,125,53,0.35)] transition-transform hover:scale-105">
            {!logoError ? (
              <img
                src={logoImg}
                alt="Orphic Solution Logo"
                className="w-full h-full object-contain rounded-xl"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-[#EF7D35] flex items-center justify-center text-white font-extrabold text-2xl shadow-inner">
                O
              </div>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Orphic Solution</h1>
          <p className="text-[#FDBA74] text-sm font-medium mt-1">Enterprise Task & Employee Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-[#F3DCCB]">
          <Outlet />
        </div>

        <p className="text-center text-[#78655A] text-xs mt-6">
          © {new Date().getFullYear()} Orphic Solution. All rights reserved.
        </p>
      </div>
    </div>
  );
}
