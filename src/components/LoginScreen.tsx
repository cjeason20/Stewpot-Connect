import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, ShieldAlert } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onGoogleLogin?: () => void;
}

export default function LoginScreen({ users, onLogin, onGoogleLogin }: LoginScreenProps) {
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
      alert('Incorrect email or password. Please try again or contact your administrator.');
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
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-brand-green overflow-hidden relative">
          <img
            src="https://lh3.googleusercontent.com/d/1Kvmezw_HwDne1bsFuCan8RE6mBEGbwdO"
            alt="Stewpot Connect Logo"
            className="w-full h-full object-contain p-2"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const sib = e.currentTarget.nextElementSibling as HTMLElement;
              if (sib) sib.style.display = 'block';
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-10 h-10 hidden"
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
            className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-md hover:bg-brand-green-dark active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            Sign In
          </button>
        </form>

        {onGoogleLogin && (
          <>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-brand-border" />
              <span className="px-3 text-xs text-brand-text-light font-medium">or</span>
              <div className="flex-1 border-t border-brand-border" />
            </div>

            <button
              onClick={onGoogleLogin}
              type="button"
              className="w-full py-3 bg-white border border-brand-border text-brand-text font-bold rounded-xl shadow-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.1-.21-.19-.44-.27-.67z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </button>
          </>
        )}

        <div className="text-center mt-5">
          <button
            onClick={() => setIsForgotOpen(true)}
            className="text-xs text-brand-green-dark hover:underline font-medium focus:outline-none cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
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
