/**
 * Stewpot Connect — Google Drive Sync
 * Paste this entire file into a new Google Apps Script project, then deploy
 * it as a Web App (Execute as: Me, Who has access: Anyone).
 *
 * The script receives the Firebase Storage download URL for each uploaded
 * file, fetches it, and saves a copy to the appropriate Drive folder.
 */

const FOLDER_IDS = {
  'audio':              '1blR-NupdPOe2JoZ8_dcLLPl4U6DkQfHs',
  'story-photos':       '1Y97nLnL5Wv1ZnMNwmMRB87uJc8T-a38j',
  'community-photos':   '1RliVUSsfZkozlBPw-QkWOzoXeDVxXlZ1',
  'profile-photos':     '15pai2Plr8Vvi_M7H-mHRh9YysDTTPmay',
};

function doPost(e) {
  try {
    var fileUrl  = e.parameter.fileUrl;
    var fileName = e.parameter.fileName || ('upload_' + Date.now());
    var folder   = e.parameter.folder;

    if (!fileUrl || !folder || !FOLDER_IDS[folder]) {
      throw new Error('Missing or invalid parameters. folder=' + folder);
    }

    var response = UrlFetchApp.fetch(fileUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      throw new Error('Could not fetch file (HTTP ' + response.getResponseCode() + ')');
    }

    var blob        = response.getBlob().setName(fileName);
    var driveFolder = DriveApp.getFolderById(FOLDER_IDS[folder]);
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

// Health-check — visit the web-app URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput('Stewpot Drive Sync is running ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}
