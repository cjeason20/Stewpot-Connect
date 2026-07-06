import React, { useEffect, useState } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';

type Platform = 'android' | 'ios' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  return isIOS ? 'ios' : isAndroid ? 'android' : null;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;
    // Don't show if user dismissed this session
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return;

    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setDeferredPrompt(null);
  };

  // Android: show when browser fires beforeinstallprompt
  if (!dismissed && platform === 'android' && deferredPrompt) {
    return (
      <div className="fixed bottom-20 inset-x-4 z-50 bg-white rounded-2xl shadow-xl border border-brand-border p-4 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand-text">Install Stewpot Connect</p>
          <p className="text-xs text-brand-text-light">Add to your home screen for quick access</p>
        </div>
        <button
          onClick={handleAndroidInstall}
          className="bg-brand-green text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0"
        >
          Install
        </button>
        <button onClick={dismiss} className="p-1 text-brand-text-light flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // iOS: show a tip banner (no browser API available on iOS)
  if (!dismissed && platform === 'ios' && !showIOSGuide) {
    return (
      <div className="fixed bottom-20 inset-x-4 z-50 bg-white rounded-2xl shadow-xl border border-brand-border p-4 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
          <PlusSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand-text">Install Stewpot Connect</p>
          <p className="text-xs text-brand-text-light">Add to your home screen for app-like access</p>
        </div>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="bg-brand-green text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0"
        >
          How?
        </button>
        <button onClick={dismiss} className="p-1 text-brand-text-light flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // iOS step-by-step guide
  if (!dismissed && platform === 'ios' && showIOSGuide) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={dismiss}>
        <div className="bg-white w-full rounded-t-2xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-bold text-base text-brand-text">Add to Home Screen</h2>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-brand-cream">
              <X className="w-4 h-4 text-brand-text-light" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-brand-text">Tap the Share button</p>
                <p className="text-xs text-brand-text-light mt-0.5">At the bottom of your browser, tap the <Share className="w-3.5 h-3.5 inline mb-0.5" /> Share icon</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-brand-text">Tap "Add to Home Screen"</p>
                <p className="text-xs text-brand-text-light mt-0.5">Scroll down in the share sheet and tap <strong>Add to Home Screen</strong></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-brand-text">Tap "Add"</p>
                <p className="text-xs text-brand-text-light mt-0.5">Confirm by tapping <strong>Add</strong> in the top-right — the app icon will appear on your home screen</p>
              </div>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-full mt-6 bg-brand-green text-white font-bold py-3 rounded-xl text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return null;
}
