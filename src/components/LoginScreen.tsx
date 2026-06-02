import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, ShieldAlert } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!user) {
      alert('Incorrect email or password. Please use ceason@stewpot.org / Stewpot1981 or your added custom user.');
      return;
    }
    onLogin(user);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    
    setIsForgotOpen(false);
    setForgotEmail('');
    
    if (found) {
      alert(`If an account exists for ${cleanEmail}, we have simulated sending a recovery email.\n\nYour actual password is: "${found.password}"`);
    } else {
      alert('No Stewpot staff account found for that email address. Please contact your administrator.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-brand-green px-6 py-12 text-center text-white relative">
      
      {/* App Branding Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-brand-green">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-10 h-10"
          >
            <path d="M12 21a9 9 0 0 0 9-9c0-1.49-.36-2.9-1.01-4.15L17 12H7L4.01 7.85A8.96 8.96 0 0 0 3 12a9 9 0 0 0 9 9Z" />
            <path d="M12 1v2" />
            <path d="M12 9v1" />
            <path d="M8 4V3" />
            <path d="M16 4V3" />
          </svg>
        </div>
        <h1 className="font-poppins font-bold text-3xl tracking-tight leading-tight">Stewpot Connect</h1>
        <div className="text-xs font-semibold tracking-widest text-[#E8F5E9] mt-2 uppercase">Staff Hub &amp; Communications</div>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-brand-text">
        <h2 className="text-lg font-bold font-poppins mb-5 text-center text-brand-text">Staff Sign In</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Staff Email address"
              className="w-full px-4 py-3 bg-brand-cream border border-brand-border rounded-xl text-sm text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-brand-cream border border-brand-border rounded-xl text-sm text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-md hover:bg-brand-green-dark active:scale-[0.98] transition-all text-sm"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => setIsForgotOpen(true)}
            className="text-xs text-brand-green-dark hover:underline font-medium focus:outline-none cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[#E8F5E9] opacity-80 max-w-xs leading-relaxed space-y-1">
        <p>Default Admin: <span className="font-bold underline">ceason@stewpot.org</span></p>
        <p>Password: <span className="font-bold underline">Stewpot1981</span></p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-brand-text shadow-2xl relative mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold font-poppins text-brand-text">Reset Password</h3>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="text-brand-text-light hover:text-brand-text font-bold text-lg p-1 focus:outline-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-brand-text-mid text-left mb-4 leading-relaxed">
              Enter your registered staff email and we will recall/simulate recovering your security credentials instantly.
            </p>
            
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Staff email address"
                className="w-full px-4 py-3 bg-brand-cream border border-brand-border rounded-xl text-sm"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark"
              >
                Recall Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
