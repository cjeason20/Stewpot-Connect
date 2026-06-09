/**
 * Fire-and-forget copy of a file (already in Firebase Storage) to the
 * matching Google Drive folder via a deployed Google Apps Script web app.
 *
 * Setup:
 *  1. Open https://script.google.com and create a new project.
 *  2. Paste the code from scripts/drive-sync-appscript.js into the editor.
 *  3. Click Deploy → New deployment → Web app.
 *     - Execute as: Me (your Google account)
 *     - Who has access: Anyone
 *  4. Copy the deployment URL and add it to your .env file:
 *       VITE_DRIVE_SYNC_URL=https://script.google.com/macros/s/YOUR_ID/exec
 *
 * If VITE_DRIVE_SYNC_URL is not set, all calls are silently skipped.
 * Drive sync failures never block or break the primary upload.
 */

export type DriveFolder =
  | 'audio'
  | 'story-photos'
  | 'community-photos'
  | 'profile-photos'
  | 'waivers';

const SYNC_URL = (import.meta as any).env?.VITE_DRIVE_SYNC_URL as string | undefined;

export async function syncToDrive(
  fileUrl: string,
  fileName: string,
  folder: DriveFolder,
): Promise<void> {
  if (!SYNC_URL) return;
  try {
    // URLSearchParams + no-cors = simple POST, no preflight needed
    const body = new URLSearchParams({ fileUrl, fileName, folder });
    await fetch(SYNC_URL, { method: 'POST', mode: 'no-cors', body });
  } catch (err) {
    console.warn('[DriveSync] non-blocking error:', err);
  }
}
