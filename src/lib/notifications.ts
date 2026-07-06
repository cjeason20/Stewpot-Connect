/**
 * FCM push notification setup.
 * Call initNotifications(userId) after a user logs in.
 * If they haven't granted permission yet, a soft prompt is shown after a short delay.
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

const VAPID_KEY = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string | undefined;

let _messagingReady = false;

/**
 * Register the FCM token for this device and save it to the user's Firestore document.
 * Safe to call multiple times — only saves when the token is new.
 */
async function registerToken(userId: string): Promise<void> {
  if (!VAPID_KEY) {
    console.warn('[Notifications] VITE_FIREBASE_VAPID_KEY not set — push disabled');
    return;
  }

  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    // arrayUnion is a no-op if the token already exists
    await updateDoc(doc(db, 'users', userId), { fcmTokens: arrayUnion(token) });

    // Handle foreground messages (app is open) — show a subtle in-app toast
    if (!_messagingReady) {
      _messagingReady = true;
      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        if (title || body) showForegroundToast(title || 'Stewpot Connect', body || '');
      });
    }
  } catch (err) {
    // Don't surface FCM errors to the user — notifications are non-critical
    console.warn('[Notifications] Token registration failed:', err);
  }
}

/**
 * Initialize notifications for a logged-in user.
 * - If permission is already granted, register immediately.
 * - If not yet decided, show a soft in-app prompt after 5 seconds.
 * - If denied, do nothing.
 */
export function initNotifications(userId: string): void {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  if (Notification.permission === 'granted') {
    registerToken(userId);
    return;
  }

  if (Notification.permission === 'denied') return;

  // 'default' — ask after a short delay so it doesn't fire the moment they log in
  setTimeout(() => showPermissionPrompt(userId), 5000);
}

// ─── Soft permission prompt ──────────────────────────────────────────────────

function showPermissionPrompt(userId: string): void {
  // Don't show if they've dismissed before
  if (localStorage.getItem('notif-prompt-dismissed')) return;

  const banner = document.createElement('div');
  banner.id = 'notif-permission-banner';
  banner.style.cssText = `
    position: fixed; bottom: 80px; left: 12px; right: 12px; z-index: 9999;
    background: #fff; border: 1px solid #C8DFC6; border-radius: 16px;
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 8px 32px rgba(26,46,26,0.14); font-family: system-ui, sans-serif;
    animation: slideUp 0.25s ease;
  `;

  banner.innerHTML = `
    <style>@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
    <div style="width:40px;height:40px;background:#4BAD47;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;color:#1A2E1A">Stay in the loop</div>
      <div style="font-size:12px;color:#7A9276;margin-top:2px">Get notified about posts, events, and birthdays</div>
    </div>
    <button id="notif-allow" style="background:#4BAD47;color:#fff;font-size:12px;font-weight:700;padding:8px 14px;border:none;border-radius:10px;cursor:pointer;flex-shrink:0">Enable</button>
    <button id="notif-dismiss" style="background:none;border:none;padding:4px;cursor:pointer;color:#7A9276;flex-shrink:0;font-size:18px;line-height:1">×</button>
  `;

  document.body.appendChild(banner);

  document.getElementById('notif-allow')?.addEventListener('click', async () => {
    banner.remove();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') registerToken(userId);
  });

  document.getElementById('notif-dismiss')?.addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('notif-prompt-dismissed', '1');
  });
}

// ─── Foreground toast ────────────────────────────────────────────────────────

function showForegroundToast(title: string, body: string): void {
  const existing = document.getElementById('notif-fg-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'notif-fg-toast';
  toast.style.cssText = `
    position: fixed; top: 16px; left: 12px; right: 12px; z-index: 9999;
    background: #1A2E1A; color: #fff; border-radius: 14px;
    padding: 12px 16px; display: flex; gap: 10px; align-items: flex-start;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25); font-family: system-ui, sans-serif;
    animation: slideDown 0.2s ease;
  `;

  toast.innerHTML = `
    <style>@keyframes slideDown { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
    <img src="/icon-192.png" style="width:36px;height:36px;border-radius:8px;flex-shrink:0" alt="" />
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;margin-bottom:2px">${escapeHtml(title)}</div>
      <div style="font-size:12px;opacity:0.8;line-height:1.4">${escapeHtml(body)}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;padding:0;line-height:1;flex-shrink:0">×</button>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
