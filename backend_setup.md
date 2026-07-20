# Google Sheets Backend Setup Guide

Follow these steps to connect your contact form to Google Sheets.

## 1. Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new sheet.
2. Name it **"Tadoba Safari Bookings"**.
3. In the first row (Header row), add these columns exactly:
   - `A1`: **Timestamp**
   - `B1`: **Name**
   - `C1`: **Email**
   - `D1`: **Phone**
   - `E1`: **ID Proof**
   - `F1`: **Package**
   - `G1`: **Message**

## 2. Open Apps Script
1. In the Google Sheet, click **Extensions** > **Apps Script**.
2. A new tab will open with a code editor.
3. Delete any code currently in `Code.gs`.
4. Copy and paste the following code:

```javascript
const SHEET_NAME = "Sheet1"; // Verify your sheet tab name

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    // Parse the JSON body sent from the website
    // If sent as regular form data, e.parameter handles it.
    // But our script.js sends JSON text, so we parse e.postData.contents
    let data; 
    try {
        data = JSON.parse(e.postData.contents);
    } catch(err) {
        // Fallback if sent as form-urlencoded
        data = e.parameter;
    }

    const newRow = headers.map(function(header) {
      if (header === 'Timestamp') return new Date();
      // Match the header name to the key in the JSON data (case-insensitive or exact)
      // Our form names are: name, email, phone, id_proof, package, message
      const key = header.toLowerCase().replace(/ /g, '_'); 
      // 'ID Proof' -> 'id_proof'
      return data[key] || data[header] || '';
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## 3. Deploy and Get Deployment ID
1. Click the blue **Deploy** button (top right) > **New deployment**.
2. Click the specific **"Select type"** gear icon (⚙️) next to "Select type".
3. Choose **Web app**.
4. Fill in the details:
   - **Description**: "Contact Form Backend"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (IMPORTANT: This must be "Anyone" so your website can send data without login).
5. Click **Deploy**.
6. You might be asked to **Authorize Access**. Click "Review permissions", choose your account, and if you see a warning screen "Google hasn't verified this app", click **Advanced** > **Go to ... (unsafe)**. This is safe because it's your own script.
7. Once deployed, copy the **Web App URL**. It will look like:
   `https://script.google.com/macros/s/AKfycby.../exec`

## 4. Updates script.js
1. Go back to your VS Code.
2. Open `script.js`.
3. Paste the copied URL into the `SCRIPT_URL` variable (around line 37).
