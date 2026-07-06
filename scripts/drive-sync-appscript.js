/**
 * Stewpot Connect — Google Drive Sync
 *
 * Deploy this as a Google Apps Script web app (see src/lib/driveSync.ts for
 * the client side that calls it). It receives a fire-and-forget POST
 * containing a Firebase Storage download URL, fetches the file
 * server-side, and saves a copy into a matching subfolder inside a parent
 * "Stewpot Connect Uploads" folder in your Google Drive. Folders are
 * created automatically the first time they're needed — no manual setup
 * required in Drive itself.
 *
 * Setup:
 *  1. Go to https://script.google.com and create a new project.
 *  2. Delete the placeholder code and paste in this entire file.
 *  3. Click "Deploy" → "New deployment".
 *     - Click the gear icon next to "Select type" and choose "Web app".
 *     - Execute as: Me (your Google account).
 *     - Who has access: Anyone.
 *  4. Click "Deploy". The first time, Google will ask you to authorize
 *     the script — review and allow it (it only touches your own Drive).
 *  5. Copy the "Web app URL" it gives you (ends in /exec).
 *  6. Set that URL as the VITE_DRIVE_SYNC_URL environment variable in
 *     Netlify (Site settings → Environment variables), then redeploy.
 *
 * If you ever update this script's code, you must create a "New
 * deployment" again (Deploy → Manage deployments → edit → new version)
 * for the changes to take effect on the existing /exec URL.
 */

var ROOT_FOLDER_NAME = 'Stewpot Connect Uploads';

var FOLDER_NAMES = {
  'audio':              'Audio Stories',
  'story-photos':       'Story Photos',
  'community-photos':   'Community Photos',
  'profile-photos':     'Profile Photos',
  'waivers':            'Waivers',
};

function doPost(e) {
  try {
    var fileUrl   = e.parameter.fileUrl;
    var fileName  = e.parameter.fileName || ('upload_' + Date.now());
    var folderKey = e.parameter.folder;
    var subfolder = e.parameter.subfolder || '';

    if (!fileUrl || !folderKey) {
      throw new Error('Missing or invalid parameters. folder=' + folderKey);
    }

    var response = UrlFetchApp.fetch(fileUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      throw new Error('Could not fetch file (HTTP ' + response.getResponseCode() + ')');
    }

    var blob = response.getBlob().setName(fileName);
    var driveFolder = getOrCreateFolder(folderKey, subfolder);
    driveFolder.createFile(blob);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, fileName: fileName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// If subfolder is provided, files go into:
//   Stewpot Connect Uploads / <folder> / <subfolder>
// Otherwise they go into:
//   Stewpot Connect Uploads / <folder>
function getOrCreateFolder(folderKey, subfolder) {
  var rootFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var root = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);

  var subName = FOLDER_NAMES[folderKey] || folderKey;
  var subFolders = root.getFoldersByName(subName);
  var folder = subFolders.hasNext() ? subFolders.next() : root.createFolder(subName);

  if (subfolder) {
    var programFolders = folder.getFoldersByName(subfolder);
    folder = programFolders.hasNext() ? programFolders.next() : folder.createFolder(subfolder);
  }

  return folder;
}

// Health-check — visit the web-app URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput('Stewpot Drive Sync is running ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}
