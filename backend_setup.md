# Google Sheets & Email Notification Backend Setup Guide

This guide explains how to connect your website contact form to a secure backend that:
1. **Stores data in a Spreadsheet** (which you can download as a **Microsoft Excel file** anytime).
2. **Sends an instant email notification** to you (the site owner) when an enquiry is made.
3. **Sends an automated confirmation email** to the customer.

---

## 1. Create the Google Sheet (Excel Storage)
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

> [!TIP]
> **How to get it in Excel (.xlsx) format:**
> Go to **File** > **Download** > **Microsoft Excel (.xlsx)**. All website entries will be exported to an Excel file instantly.

---

## 2. Open Apps Script and Paste the Backend Code
1. In your Google Sheet, click **Extensions** > **Apps Script** in the top menu.
2. A new tab will open with a code editor.
3. Delete any default code in `Code.gs`.
4. Copy and paste the following upgraded code:

```javascript
const SHEET_NAME = "Sheet1"; // Verify your sheet tab name (usually Sheet1)

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    // Parse the JSON body sent from the website
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
      const key = header.toLowerCase().replace(/ /g, '_'); 
      return data[key] || data[header] || '';
    });

    // Write to Google Sheet
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    // Send email notifications
    try {
      sendEmailNotifications(data);
    } catch (emailError) {
      console.error("Email notification failed: " + emailError.toString());
    }

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

/**
 * Sends a notification email to the owner and a confirmation email to the user.
 */
function sendEmailNotifications(data) {
  // Session.getEffectiveUser().getEmail() automatically gets the email of the person who deployed the script.
  const ownerEmail = Session.getEffectiveUser().getEmail(); 
  
  const name = data.name || "N/A";
  const email = data.email || "N/A";
  const phone = data.phone || "N/A";
  const idProof = data.id_proof || "N/A";
  const packageName = data.package || "N/A";
  const message = data.message || "N/A";
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " (IST)";

  // 1. Email Notification to Site Owner
  const ownerSubject = `New Tour Inquiry: ${packageName} - ${name}`;
  const ownerBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #0b5394; border-bottom: 2px solid #0b5394; padding-bottom: 10px; margin-top: 0;">New Booking Inquiry</h2>
      <p>A new booking inquiry has been submitted on Shree Sadguru Tours and Travels website.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; width: 35%; border: 1px solid #ddd;">Name:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Email:</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Phone:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">ID Proof:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${idProof}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Package Interest:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${packageName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Special Request:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${message}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Timestamp:</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${timestamp}</td>
        </tr>
      </table>
      
      <div style="margin-top: 25px; text-align: center;">
        <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="background-color: #25D366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px; font-size: 14px;">
          💬 Reply on WhatsApp
        </a>
        <a href="mailto:${email}" style="background-color: #0b5394; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 14px;">
          ✉️ Reply via Email
        </a>
      </div>
    </div>
  `;

  // Send email to owner
  MailApp.sendEmail({
    to: ownerEmail,
    subject: ownerSubject,
    htmlBody: ownerBody
  });

  // 2. Automated Confirmation Email to Customer
  if (email && email.includes("@")) {
    const customerSubject = `Booking Inquiry Received - Shree Sadguru Tours & Travels`;
    const customerBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0b5394; text-align: center; margin-top: 0;">Inquiry Received Successfully!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to <strong>Shree Sadguru Tours and Travels</strong>. We have received your inquiry for the <strong>${packageName}</strong> and our team is checking availability for you.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0b5394;">
          <h4 style="margin-top: 0; color: #333;">Your Submission Summary:</h4>
          <ul style="list-style-type: none; padding-left: 0; margin-bottom: 0; line-height: 1.6;">
            <li><strong>Package:</strong> ${packageName}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>ID Proof:</strong> ${idProof}</li>
            ${message && message !== "N/A" && message !== "" ? `<li><strong>Special Request:</strong> ${message}</li>` : ""}
          </ul>
        </div>
        
        <p>A booking representative will contact you shortly via phone or WhatsApp to finalize your booking details.</p>
        
        <p>If you have any urgent questions, please feel free to reach out to us directly:</p>
        <p style="text-align: center; margin-top: 20px; line-height: 1.6;">
          <strong>📞 Call Us:</strong> +91 9975202821 <br/>
          <strong>💬 WhatsApp:</strong> +91 9975202821
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #777; text-align: center; line-height: 1.4;">
          This is an automated confirmation of your website enquiry.<br/>
          &copy; ${new Date().getFullYear()} Shree Sadguru Tours and Travels. All rights reserved.
        </p>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: customerSubject,
      htmlBody: customerBody
    });
  }
}
```

---

## 3. Deploy and Get Web App URL
1. Click the blue **Deploy** button (top right of Apps Script editor) > **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Fill in the details:
   - **Description**: "Contact Form Backend with Email"
   - **Execute as**: **Me** (your email address)
   - **Who has access**: **Anyone** (IMPORTANT: Set this to "Anyone" so the website can submit the form data securely without requiring login).
4. Click **Deploy**.
5. Click **Review permissions** when prompted.
6. Choose your Google Account.
7. You might see a warning screen: *"Google hasn't verified this app"*. Click **Advanced** at the bottom, then click **Go to Untitled project (unsafe)**. This is perfectly safe as it is your own script running on your own Google Drive.
8. Click **Allow** to give the script permission to write to Sheets and send emails on your behalf.
9. Once deployed, copy the **Web App URL** shown under "Web app" (it will end with `/exec`).

---

## 4. Update the Website Code
1. Open [script.js](file:///c:/Users/Yashraj%20Patil/Downloads/Tours-And-Travels-main/script.js).
2. Look for the `SCRIPT_URL` variable around line 142.
3. Replace the existing URL with the one you copied in Step 3.

```javascript
    // Google Apps Script Web App URL
    const SCRIPT_URL = "YOUR_COPIED_WEB_APP_URL";
```

4. Save the file.
5. Commit and push the changes to GitHub/Vercel.

Your site is now fully capable of saving customer submissions to Google Sheets (which downloads as Excel) and sending custom email alerts to you and confirmation emails to your customers!
