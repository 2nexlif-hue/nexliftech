import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates clean, anti-spam optimized HTML and Plain Text confirmation emails
 * adhering to RFC 5322, CAN-SPAM, and modern deliverability standards (SPF/DKIM).
 */
export function buildSubscriptionEmailContent(subData) {
  const portalUrl = 'https://nexliftech.space/botany-test-series';
  const supportEmail = 'admissions@nexliftech.space';
  const contactEmail = 'contact@nexliftech.com';
  const candidateName = subData.userName || subData.userEmail?.split('@')[0] || 'Candidate';
  const formattedDate = new Date(subData.activatedAt || Date.now()).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const syllabusScope = subData.allowedUnits?.includes('all') || subData.planType === 'full_series'
    ? 'Complete 10-Unit PSC Syllabus (All 35 Tests, Clusters, Specials & 9 Grand Mocks)'
    : `Targeted Unit Pass (${subData.allowedUnits?.join(', ') || 'Single Unit'})`;

  // 1. Pristine Plain-Text Alternative (Crucial for passing SpamAssassin and DKIM filters)
  const plainText = `
OFFICIAL ENROLLMENT CONFIRMATION & ACCESS CREDENTIALS
Botany Assistant Professor (PSC) Computer-Based Testing Suite
NexLifTech Academic Platform • https://nexliftech.space

Dear ${candidateName},

Thank you for enrolling in the Botany Assistant Professor CBT Entrance Examination Test Series. Your subscription has been confirmed and verified.

----------------------------------------------------------------------
TRANSACTION & ACCESS SUMMARY
----------------------------------------------------------------------
Subscription ID: ${subData.subscriptionId}
Payment ID (Razorpay): ${subData.razorpayPaymentId}
Order ID: ${subData.razorpayOrderId}
Enrolled Package: ${subData.planTitle}
Coverage: ${syllabusScope}
Amount Paid: INR ${subData.amountPaid}.00 (Tax Inclusive)
Date of Activation: ${formattedDate}
Access Validity: Unlimited Re-attempts until PSC Examination 2026
Status: ACTIVE & VERIFIED

----------------------------------------------------------------------
HOW TO ACCESS YOUR CBT TESTS
----------------------------------------------------------------------
1. Navigate directly to the testing portal:
   ${portalUrl}

2. Sign in using your registered email:
   ${subData.userEmail}

3. Click "Start CBT" on any scheduled test in your enrolled calendar to begin your timed computer-based simulation.

----------------------------------------------------------------------
KEY PLATFORM FEATURES UNLOCKED
----------------------------------------------------------------------
• Negative Marking Calibration (+1.0 for correct, -0.25 penalty for wrong)
• 100% Option-by-Option Scientific Rationale (explaining correct & distractor options)
• Interactive Question Palette (Answered, Flagged, Unattempted)
• Instant Scorecard & Performance Analytics with permanent history

Academic Curator:
Dr. Aubid Hussain Malik (Assistant Professor, Botany)

Support & Inquiries:
Email: ${supportEmail} / ${contactEmail}
Portal: https://nexliftech.space

NexLifTech Education Platform • J&K, India
This is an authentic transactional receipt issued to ${subData.userEmail}.
`.trim();

  // 2. High-Deliverability, Professional HTML Template
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Confirmation - Botany CBT Suite</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0b0f19; padding: 30px 10px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 620px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .header { background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 28px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #334155; }
    .receipt-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .receipt-table { width: 100%; font-size: 13px; }
    .receipt-table td { padding: 8px 4px; vertical-align: top; }
    .receipt-label { color: #64748b; font-weight: 600; width: 38%; }
    .receipt-value { color: #0f172a; font-weight: 700; }
    .btn-wrap { text-align: center; margin: 28px 0 20px 0; }
    .cta-button { display: inline-block; background-color: #10b981; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 3px 12px rgba(16, 185, 129, 0.35); }
    .footer { background-color: #f1f5f9; padding: 20px 32px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #a7f3d0; margin-bottom: 4px;">OFFICIAL ENROLLMENT CONFIRMATION</div>
          <h1>Botany Assistant Professor CBT Suite</h1>
          <p>Curated by Dr. Aubid Hussain Malik • NexLifTech Engine</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p style="margin-top: 0;">Dear <strong>${candidateName}</strong>,</p>
          <p>Your payment has been successfully verified, and your candidate access credentials to the <strong>Botany Assistant Professor Entrance Examination Test Series</strong> are now fully active.</p>

          <div class="receipt-box">
            <table class="receipt-table">
              <tr>
                <td class="receipt-label">Subscription ID:</td>
                <td class="receipt-value" style="font-family: monospace; color: #047857;">${subData.subscriptionId}</td>
              </tr>
              <tr>
                <td class="receipt-label">Razorpay Payment ID:</td>
                <td class="receipt-value" style="font-family: monospace;">${subData.razorpayPaymentId}</td>
              </tr>
              <tr>
                <td class="receipt-label">Package Enrolled:</td>
                <td class="receipt-value">${subData.planTitle}</td>
              </tr>
              <tr>
                <td class="receipt-label">Syllabus Scope:</td>
                <td class="receipt-value">${syllabusScope}</td>
              </tr>
              <tr>
                <td class="receipt-label">Amount Paid:</td>
                <td class="receipt-value" style="color: #047857; font-size: 15px;">₹${subData.amountPaid}.00 (Tax Inclusive)</td>
              </tr>
              <tr>
                <td class="receipt-label">Activated On:</td>
                <td class="receipt-value">${formattedDate}</td>
              </tr>
              <tr>
                <td class="receipt-label">Access Validity:</td>
                <td class="receipt-value">Valid until PSC Examination 2026</td>
              </tr>
            </table>
          </div>

          <p><strong>Next Steps:</strong> You can launch any scheduled test or drill immediately. The CBT engine includes live countdown timers, question jumping palette, option-by-option scientific rationale, and negative marking calibration (-0.25).</p>

          <div class="btn-wrap">
            <a href="${portalUrl}" class="cta-button" target="_blank">Launch My CBT Tests Now →</a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
            Need assistance or syllabus guidance? Contact our academic desk at <a href="mailto:${supportEmail}" style="color: #047857;">${supportEmail}</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 4px 0;">NexLifTech Education & Research Platform • Official Domain: <a href="https://nexliftech.space" style="color: #64748b;">nexliftech.space</a></p>
          <p style="margin: 0;">This email was sent to ${subData.userEmail} to confirm your authorized examination subscription. Please save this record for your records.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`.trim();

  return {
    subject: `Official Confirmation & Receipt: Botany CBT Test Series [ID: ${subData.subscriptionId.slice(-8)}]`,
    text: plainText,
    html: htmlContent
  };
}

/**
 * Dispatches subscription confirmation email via Firestore mail queue & secondary channels
 */
export async function sendSubscriptionConfirmationEmail(subData) {
  if (!subData?.userEmail) {
    console.warn('Cannot send subscription email: Missing userEmail.');
    return false;
  }

  const emailPayload = buildSubscriptionEmailContent(subData);

  // 1. Push to Firestore 'mail' collection (standard Trigger Email Extension queue)
  try {
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: [subData.userEmail],
      replyTo: 'admissions@nexliftech.space',
      message: {
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html
      },
      metadata: {
        subscriptionId: subData.subscriptionId,
        paymentId: subData.razorpayPaymentId,
        userId: subData.userId,
        sentAt: new Date().toISOString()
      },
      createdAt: serverTimestamp()
    });
    console.log(`✓ Subscription confirmation queued in Firestore for ${subData.userEmail}`);
  } catch (err) {
    console.warn('Could not queue email in Firestore mail collection:', err?.message || err);
  }

  // 2. Backup notification to Netlify form pipeline (if running on Netlify)
  try {
    const backupFormData = new FormData();
    backupFormData.append('form-name', 'subscription_notification');
    backupFormData.append('subscriptionId', subData.subscriptionId);
    backupFormData.append('userEmail', subData.userEmail);
    backupFormData.append('userName', subData.userName || '');
    backupFormData.append('amount', String(subData.amountPaid));
    backupFormData.append('planTitle', subData.planTitle);
    backupFormData.append('paymentId', subData.razorpayPaymentId);

    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(backupFormData).toString()
    }).catch(() => null);
  } catch (e) {}

  return true;
}

/**
 * Generates an instant printable and downloadable invoice/certificate for candidate
 */
export function printSubscriptionReceipt(subData) {
  const content = buildSubscriptionEmailContent(subData);
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${subData.subscriptionId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1e293b; }
          .print-btn { background: #10b981; color: #fff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 20px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        ${content.html}
        <script>
          setTimeout(() => { window.print(); }, 600);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
