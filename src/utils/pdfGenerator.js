function printHtmlViaIframe(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
}

/**
 * Generate Official Monthly Monitoring Checklist PDF for Anganwadi Centres (AWC)
 * Office of the District Development Commissioner, Anantnag (Poshan / ICDS)
 * Optimized for single A4 page printing.
 * @param {object} r - Monitoring report data object
 */
export function generateAwcMonitoringPdf(r = {}) {
  const projectName = r.projectName || 'Shangus';
  const awcName = r.awcName || 'AWC Shangus A';
  const visitDate = r.visitDate || new Date().toISOString().split('T')[0];
  const officerName = r.officerName || 'District Officer';
  const awwPresent = r.awwPresent || 'Yes';
  const helperPresent = r.helperPresent || 'Yes';
  const childrenEnrolled = r.childrenEnrolled ?? '—';
  const childrenPresentToday = r.childrenPresentToday ?? '—';
  const womenEnrolled = r.womenEnrolled ?? '—';

  const suppNutritionRegular = r.suppNutritionRegular || 'Yes';
  const thrDistributionRegular = r.thrDistributionRegular || 'Yes';
  const samMamIdentified = r.samMamIdentified || 'No';
  const immunizationUpdated = r.immunizationUpdated || 'Yes';
  const referralCases = r.referralCases || 'Nil';

  const ecceStatus = r.ecceStatus || 'Satisfactory';
  const learningMaterialAvailable = r.learningMaterialAvailable || 'Yes';
  const childrenEngaged = r.childrenEngaged || 'Yes';
  const cleanEnvironment = r.cleanEnvironment || 'Yes';

  const statusBuilding = r.statusBuilding || 'Normal';
  const statusSafeDrinkingWater = r.statusSafeDrinkingWater || 'Yes';
  const statusFunctionalToilet = r.statusFunctionalToilet || 'Yes';
  const statusElectricity = r.statusElectricity || 'Yes';
  const weighingMachineFunctional = r.weighingMachineFunctional || 'Yes';
  const utensilsStorageAdequate = r.utensilsStorageAdequate || 'Yes';

  const anmVisitConducted = r.anmVisitConducted || 'Yes';
  const anmDetails = r.anmDetails || (r.anmName ? `Date: ${r.anmVisitDate || '—'} / ANM: ${r.anmName || '—'} / Checked: ${r.anmWomenChecked || '0'}` : 'Conducted regularly');
  const vhsndHeld = r.vhsndHeld || 'Yes';
  const priInvolvement = r.priInvolvement || 'Yes';

  const issueA = r.issueA || 'None observed';
  const issueB = r.issueB || '';
  const issueC = r.issueC || '';
  const issueD = r.issueD || '';

  const action1 = r.action1 || 'Continue regular functioning and record sync on Poshan Tracker.';
  const action2 = r.action2 || '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AWC Monthly Monitoring Checklist - ${awcName} - ${visitDate}</title>
      <style>
        @page { size: A4 portrait; margin: 6mm 10mm; }
        body { font-family: "Times New Roman", Times, serif; font-size: 10px; color: #000; margin: 0; padding: 0; line-height: 1.25; }
        .wrapper { width: 100%; box-sizing: border-box; }
        .header { text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 4px; }
        .emblem { font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .govt-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }
        .sub-title { font-size: 10px; font-weight: bold; }
        .doc-title { font-size: 11.5px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 4px 0 6px 0; background: #f1f5f9; padding: 2px 0; border: 1px solid #94a3b8; }
        
        .section-heading { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 5px; margin-bottom: 3px; border-bottom: 1px solid #334155; background: #f8fafc; padding: 1.5px 4px; }
        
        .details-grid { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        .details-grid td { padding: 2px 4px; border: 1px solid #cbd5e1; vertical-align: middle; font-size: 9.5px; }
        .lbl { font-weight: bold; width: 34%; background: #f1f5f9; }
        
        .two-col-tables { display: flex; gap: 6px; width: 100%; margin-bottom: 4px; }
        .col-table { flex: 1; }

        .custom-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
        .custom-table th, .custom-table td { border: 1px solid #475569; padding: 2px 5px; text-align: left; font-size: 9.5px; }
        .custom-table th { background: #e2e8f0; font-weight: bold; }

        .list-items { margin: 2px 0; padding: 0; list-style: none; font-size: 9.5px; }
        .list-items li { margin-bottom: 2px; padding-left: 2px; }
        .bold-tag { font-weight: bold; }
        
        .sigs-container { margin-top: 15px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 45%; text-align: center; font-weight: bold; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="emblem">Government of Jammu & Kashmir</div>
          <div class="govt-title">Office of the District Development Commissioner, Anantnag</div>
          <div class="sub-title">District Programme Officer, POSHAN / ICDS, Anantnag</div>
        </div>

        <div class="doc-title">FORMAT: MONTHLY MONITORING CHECKLIST FOR ANGANWADI CENTRE</div>

        <!-- A. BASIC DETAILS -->
        <div class="section-heading">A. Basic Details</div>
        <table class="details-grid">
          <tr>
            <td class="lbl">Name of the project:</td>
            <td><strong>${projectName}</strong></td>
            <td class="lbl">Name of AWC:</td>
            <td><strong>${awcName}</strong></td>
          </tr>
          <tr>
            <td class="lbl">Date of Visit:</td>
            <td><strong>${visitDate}</strong></td>
            <td class="lbl">Officer Name:</td>
            <td><strong>${officerName}</strong></td>
          </tr>
          <tr>
            <td class="lbl">AWW Present:</td>
            <td>${awwPresent}</td>
            <td class="lbl">Helper Present:</td>
            <td>${helperPresent}</td>
          </tr>
          <tr>
            <td class="lbl">No. of Children Enrolled:</td>
            <td>${childrenEnrolled} (Present: <strong>${childrenPresentToday}</strong>)</td>
            <td class="lbl">Pregnant & Lactating Women Enrolled:</td>
            <td><strong>${womenEnrolled}</strong></td>
          </tr>
        </table>

        <!-- B. NUTRITION & HEALTH -->
        <div class="section-heading">B. Nutrition & Health (As per Poshan Tracker)</div>
        <table class="details-grid">
          <tr>
            <td class="lbl">Supplementary Nutrition Regular:</td>
            <td>${suppNutritionRegular}</td>
            <td class="lbl">THR Distribution Regular:</td>
            <td>${thrDistributionRegular}</td>
          </tr>
          <tr>
            <td class="lbl">SAM/MAM Children Identified:</td>
            <td>${samMamIdentified}</td>
            <td class="lbl">Immunization Status Updated:</td>
            <td>${immunizationUpdated}</td>
          </tr>
          <tr>
            <td class="lbl">Referral Cases:</td>
            <td colspan="3">${referralCases}</td>
          </tr>
        </table>

        <!-- C. EARLY CHILDHOOD CARE AND EDUCATION (ECCE) -->
        <div class="section-heading">C. Early Childhood Care and Education (ECCE)</div>
        <table class="details-grid">
          <tr>
            <td class="lbl">ECCE Activities / Knowledge Status:</td>
            <td colspan="3">${ecceStatus}</td>
          </tr>
          <tr>
            <td class="lbl">Learning Material Available:</td>
            <td>${learningMaterialAvailable}</td>
            <td class="lbl">Children Engaged in Activities:</td>
            <td>${childrenEngaged}</td>
          </tr>
          <tr>
            <td class="lbl">Clean & Child-Friendly Environment:</td>
            <td colspan="3">${cleanEnvironment}</td>
          </tr>
        </table>

        <!-- D & E SIDE BY SIDE TABLES FOR COMPACT SINGLE-PAGE FIT -->
        <div class="two-col-tables">
          <!-- D. INFRASTRUCTURE -->
          <div class="col-table">
            <div class="section-heading">D. Infrastructure</div>
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th style="width: 45%;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Status of Building</td><td>${statusBuilding}</td></tr>
                <tr><td>Safe Drinking Water</td><td>${statusSafeDrinkingWater}</td></tr>
                <tr><td>Functional Toilet</td><td>${statusFunctionalToilet}</td></tr>
                <tr><td>Electricity Status</td><td>${statusElectricity}</td></tr>
                <tr><td>Weighing Machine Functional</td><td>${weighingMachineFunctional}</td></tr>
                <tr><td>Adequate Utensils/Storage</td><td>${utensilsStorageAdequate}</td></tr>
              </tbody>
            </table>
          </div>

          <!-- E. CONVERGENCE -->
          <div class="col-table">
            <div class="section-heading">E. Convergence</div>
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="width: 55%;">Details / Response</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>ANM Visit Conducted</td><td>${anmVisitConducted} (${anmDetails})</td></tr>
                <tr><td>VHSND Held</td><td>${vhsndHeld}</td></tr>
                <tr><td>PRI Involvement</td><td>${priInvolvement}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- F. ISSUES OBSERVED -->
        <div class="section-heading">F. Issues Observed</div>
        <ul class="list-items">
          <li><span class="bold-tag">A.</span> ${issueA || 'None observed'}</li>
          ${issueB ? `<li><span class="bold-tag">B.</span> ${issueB}</li>` : ''}
          ${issueC ? `<li><span class="bold-tag">C.</span> ${issueC}</li>` : ''}
          ${issueD ? `<li><span class="bold-tag">D.</span> ${issueD}</li>` : ''}
        </ul>

        <!-- G. ACTION SUGGESTED -->
        <div class="section-heading">G. Action Suggested</div>
        <ul class="list-items">
          <li><span class="bold-tag">1.</span> ${action1 || 'Continue regular functioning and record sync on Poshan Tracker.'}</li>
          ${action2 ? `<li><span class="bold-tag">2.</span> ${action2}</li>` : ''}
        </ul>

        <!-- SIGNATURES -->
        <table style="width: 100%; margin-top: 22px;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: bottom;">
              <div style="margin-bottom: 25px;"></div>
              <div style="border-top: 1px dashed #000; width: 75%; margin: 0 auto; padding-top: 2px; font-weight: bold;">
                Signature of Officer<br/>
                <span style="font-weight: normal; font-size: 9.5px;">(${officerName})</span>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: bottom;">
              <div style="margin-bottom: 25px;"></div>
              <div style="border-top: 1px dashed #000; width: 75%; margin: 0 auto; padding-top: 2px; font-weight: bold;">
                Signature of AWW<br/>
                <span style="font-weight: normal; font-size: 9.5px;">(Anganwadi Worker)</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  printHtmlViaIframe(htmlContent);
}
