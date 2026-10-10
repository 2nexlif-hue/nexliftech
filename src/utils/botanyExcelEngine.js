import * as XLSX from 'xlsx';

// Standard official column headers
export const EXCEL_COLUMNS = [
  { key: 'sNo', label: 'S.No', width: 8 },
  { key: 'question', label: 'Question', width: 45 },
  { key: 'optionA', label: 'Option A', width: 28 },
  { key: 'optionB', label: 'Option B', width: 28 },
  { key: 'optionC', label: 'Option C', width: 28 },
  { key: 'optionD', label: 'Option D', width: 28 },
  { key: 'correctOption', label: 'Correct Answer (Key)', width: 22 },
  { key: 'analysisA', label: 'Analysis - Option A', width: 38 },
  { key: 'analysisB', label: 'Analysis - Option B', width: 38 },
  { key: 'analysisC', label: 'Analysis - Option C', width: 38 },
  { key: 'analysisD', label: 'Analysis - Option D', width: 38 },
  { key: 'referenceNote', label: 'Context Note', width: 35 }
];

// Official sample questions tailored to Botany Assistant Professor exam
export const OFFICIAL_SAMPLE_QUESTIONS = [
  {
    question: 'Which feature is characteristic of Tobacco mosaic virus (TMV) virions?',
    optionA: 'Icosahedral capsid with circular ssDNA',
    optionB: 'Rod-shaped particle containing positive-sense ssRNA',
    optionC: 'Enveloped particle containing dsRNA',
    optionD: 'Filamentous particle containing dsDNA',
    correctOption: 'B',
    analysisA: 'Incorrect. TMV is not an icosahedral DNA virus.',
    analysisB: 'Correct. TMV is a rigid rod-shaped virus with a single-stranded positive-sense RNA genome.',
    analysisC: 'Incorrect. TMV is non-enveloped and its genome is RNA, not dsRNA.',
    analysisD: 'Incorrect. TMV does not contain DNA.',
    referenceNote: 'Syllabus focus: viruses—general characteristics and ultrastructure of TMV.'
  },
  {
    question: 'The genome of Cauliflower mosaic virus (CaMV) is best described as:',
    optionA: 'Circular double-stranded DNA with a discontinuity/gap',
    optionB: 'Linear double-stranded DNA',
    optionC: 'Positive-sense single-stranded RNA',
    optionD: 'Negative-sense single-stranded RNA',
    correctOption: 'A',
    analysisA: 'Correct. CaMV has a circular dsDNA genome with characteristic discontinuities that are repaired during replication.',
    analysisB: 'Incorrect. CaMV DNA is circular rather than a simple linear dsDNA molecule.',
    analysisC: 'Incorrect. CaMV is a DNA virus, not an RNA virus.',
    analysisD: 'Incorrect. CaMV is not a negative-sense RNA virus.',
    referenceNote: 'Syllabus focus: ultrastructure and replication of CaMV.'
  },
  {
    question: 'In a typical lytic bacteriophage cycle, which event occurs first after adsorption?',
    optionA: 'Assembly of mature phage particles',
    optionB: 'Host-cell lysis',
    optionC: 'Injection of the phage nucleic acid into the host',
    optionD: 'Formation of bacterial endospores',
    correctOption: 'C',
    analysisA: 'Incorrect. Assembly occurs late in the lytic cycle.',
    analysisB: 'Incorrect. Lysis is the final release step of the lytic cycle.',
    analysisC: 'Correct. After attachment, the phage delivers its nucleic acid into the host cell.',
    analysisD: 'Incorrect. Endospore formation is a bacterial survival response, not a normal phage step.',
    referenceNote: 'Syllabus focus: structural characteristics and biology of bacteriophages such as λ and T4.'
  }
];

export function downloadExcelTemplate(unitId = 'unit_1', unitTitle = 'Unit 1') {
  const isDemo = unitId === 'diagnostic_demo';
  const rows = OFFICIAL_SAMPLE_QUESTIONS.map((q, idx) => ({
    'S.No': idx + 1,
    'Question': q.question,
    'Option A': q.optionA,
    'Option B': q.optionB,
    'Option C': q.optionC,
    'Option D': q.optionD,
    'Correct Answer (Key)': q.correctOption,
    'Analysis - Option A': q.analysisA,
    'Analysis - Option B': q.analysisB,
    'Analysis - Option C': q.analysisC,
    'Analysis - Option D': q.analysisD,
    'Context Note': q.referenceNote
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = EXCEL_COLUMNS.map(col => ({ wch: col.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isDemo ? 'Diagnostic Demo Bank' : 'Question Bank');

  const filePrefix = isDemo 
    ? 'Template_Diagnostic_Entrance_Demo_10_to_30_MCQs.xlsx' 
    : `Template_${unitId}_${unitTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Questions.xlsx`;
  XLSX.writeFile(workbook, filePrefix);
}

/**
 * Exports any saved question list to a downloadable Excel file using canonical headers
 */
export function exportQuestionsToExcel(questions, unitTitle = 'Unit', version = 1) {
  if (!questions || !questions.length) {
    throw new Error('No questions to export.');
  }

  const rows = questions.map((q, idx) => ({
    'S.No': q.sNo || idx + 1,
    'Question': q.question || '',
    'Option A': q.optionA || '',
    'Option B': q.optionB || '',
    'Option C': q.optionC || '',
    'Option D': q.optionD || '',
    'Correct Answer (Key)': (q.correctOption || '').toUpperCase(),
    'Analysis - Option A': q.analysisA || '',
    'Analysis - Option B': q.analysisB || '',
    'Analysis - Option C': q.analysisC || '',
    'Analysis - Option D': q.analysisD || '',
    'Context Note': q.referenceNote || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = EXCEL_COLUMNS.map(col => ({ wch: col.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

  const safeTitle = unitTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${safeTitle}_v${version}_Questions.xlsx`);
}

function cleanKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[\u2013\u2014\-_/()]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an uploaded sheet row into a structured Question object with validation
 */
function normalizeRow(row, rowIndex) {
  const keys = Object.keys(row);
  const getVal = (possibleHeaders) => {
    const cleanedPossible = possibleHeaders.map(h => cleanKey(h));
    for (const k of keys) {
      const ck = cleanKey(k);
      if (cleanedPossible.includes(ck)) {
        if (row[k] !== undefined && row[k] !== null) {
          return String(row[k]).trim();
        }
      }
    }
    return '';
  };

  const sNoRaw = getVal(['s.no', 's no', 'sno', 'sl no', 'sr no', 'q no', 'serial no', 'number', 'no']);
  const sNo = sNoRaw ? (parseInt(sNoRaw, 10) || (rowIndex + 1)) : (rowIndex + 1);
  const question = getVal(['question', 'question text', 'q', 'item', 'statement', 'question statement']);
  const optionA = getVal(['option a', 'optiona', 'opt a', 'a']);
  const optionB = getVal(['option b', 'optionb', 'opt b', 'b']);
  const optionC = getVal(['option c', 'optionc', 'opt c', 'c']);
  const optionD = getVal(['option d', 'optiond', 'opt d', 'd']);
  
  let correctRaw = getVal([
    'correct answer (key)', 
    'correct answer key', 
    'correct answer', 
    'correct option (key)', 
    'correct option', 
    'answer (key)',
    'key',
    'answer', 
    'correct', 
    'ans'
  ]);
  let correctOption = '';

  if (correctRaw) {
    const cleaned = correctRaw.trim().toUpperCase().replace(/[\(\)\[\]\.\:]/g, '').trim();
    if (['A', 'B', 'C', 'D'].includes(cleaned)) {
      correctOption = cleaned;
    } else if (cleaned.startsWith('OPTION')) {
      const char = cleaned.replace('OPTION', '').trim()[0];
      if (['A', 'B', 'C', 'D'].includes(char)) correctOption = char;
    } else if (cleaned.startsWith('ANS')) {
      const char = cleaned.replace('ANS', '').trim()[0];
      if (['A', 'B', 'C', 'D'].includes(char)) correctOption = char;
    } else if (cleaned === optionA?.toUpperCase()) {
      correctOption = 'A';
    } else if (cleaned === optionB?.toUpperCase()) {
      correctOption = 'B';
    } else if (cleaned === optionC?.toUpperCase()) {
      correctOption = 'C';
    } else if (cleaned === optionD?.toUpperCase()) {
      correctOption = 'D';
    }
  }

  const analysisA = getVal(['analysis - option a', 'analysis option a', 'analysis a', 'opt a analysis', 'why a', 'option a analysis']);
  const analysisB = getVal(['analysis - option b', 'analysis option b', 'analysis b', 'opt b analysis', 'why b', 'option b analysis']);
  const analysisC = getVal(['analysis - option c', 'analysis option c', 'analysis c', 'opt c analysis', 'why c', 'option c analysis']);
  const analysisD = getVal(['analysis - option d', 'analysis option d', 'analysis d', 'opt d analysis', 'why d', 'option d analysis']);
  const referenceNote = getVal([
    'context note', 'brief context note', 'general note / exam tip', 
    'general note', 'explanation', 'note', 'notes', 'exam tip', 'reference note', 'brief note', 'rationale', 'syllabus reference', 'context'
  ]);

  // If entire row is blank, skip it cleanly
  const isCompletelyEmpty = !question && !optionA && !optionB && !optionC && !optionD && !correctRaw;
  if (isCompletelyEmpty) {
    return null;
  }

  const errors = [];
  if (!question) errors.push('Question statement is empty.');
  if (!optionA) errors.push('Option A is missing.');
  if (!optionB) errors.push('Option B is missing.');
  if (!optionC) errors.push('Option C is missing.');
  if (!optionD) errors.push('Option D is missing.');
  if (!correctOption) errors.push(`Invalid or missing correct answer (must be A, B, C, or D). Received: "${correctRaw || 'empty'}".`);

  return {
    id: `q_${Date.now()}_${rowIndex}`,
    rowNumber: rowIndex + 2, // Excel 1-based index including header
    sNo,
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption,
    analysisA: analysisA || (correctOption === 'A' ? 'Correct answer.' : ''),
    analysisB: analysisB || (correctOption === 'B' ? 'Correct answer.' : ''),
    analysisC: analysisC || (correctOption === 'C' ? 'Correct answer.' : ''),
    analysisD: analysisD || (correctOption === 'D' ? 'Correct answer.' : ''),
    referenceNote,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parses an Excel ArrayBuffer and returns structured questions
 */
export function parseExcelBuffer(buffer, fileName = 'question_bank.xlsx') {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error('The Excel file contains no readable sheets.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawJson.length) {
    throw new Error('The sheet is empty. Please ensure rows follow the template format.');
  }

  let detectedUnitId = null;
  const codedTestMatch = fileName.match(/test[_-](DT_F|T\d+_[IVX]+|TM_[IVX]+|TGF|TREE)(?:[_\s.-]|$)/i);
  const unitMatch = fileName.match(/unit[_\s-]?0?(\d+)/i);
  if (codedTestMatch) {
    detectedUnitId = `test_${codedTestMatch[1].toUpperCase()}`;
  } else if (unitMatch && unitMatch[1]) {
    detectedUnitId = `unit_${parseInt(unitMatch[1], 10)}`;
  } else if (/demo|diagnos|sample|entrance/i.test(fileName)) {
    detectedUnitId = 'diagnostic_demo';
  } else {
    const testMatch = fileName.match(/test[_\s-]?0?(\d+)/i);
    if (testMatch && testMatch[1]) {
      const num = parseInt(testMatch[1], 10);
      detectedUnitId = `test_${num < 10 ? '0' + num : num}`;
    }
  }

  // Fallback 1: check if sheet has a 'Unit' column in its rows
  if (!detectedUnitId && rawJson.length > 0) {
    for (const row of rawJson) {
      const keys = Object.keys(row);
      for (const k of keys) {
        const ck = cleanKey(k);
        if (ck === 'unit' || ck === 'unit no' || ck === 'unit number' || ck === 'syllabus unit') {
          const val = String(row[k] || '');
          const m = val.match(/unit[_\s-]?0?(\d+)/i) || val.match(/^[_\s-]?0?(\d+)$/);
          if (m && m[1]) {
            detectedUnitId = `unit_${parseInt(m[1], 10)}`;
            break;
          }
        }
      }
      if (detectedUnitId) break;
    }
  }

  // Fallback 2: leading number in filename e.g. 01_Microbiology or 10_Biotechniques
  if (!detectedUnitId) {
    const leadingNumMatch = fileName.match(/^0?(\d+)[_\s-]/);
    if (leadingNumMatch && leadingNumMatch[1]) {
      const n = parseInt(leadingNumMatch[1], 10);
      if (n >= 1 && n <= 10) {
        detectedUnitId = `unit_${n}`;
      }
    }
  }

  const parsedQuestions = rawJson.map((row, idx) => normalizeRow(row, idx)).filter(Boolean);
  const validQuestions = parsedQuestions.filter(q => q.isValid);
  const invalidQuestions = parsedQuestions.filter(q => !q.isValid);

  return {
    fileName,
    detectedUnitId,
    totalRows: parsedQuestions.length,
    validCount: validQuestions.length,
    invalidCount: invalidQuestions.length,
    questions: parsedQuestions,
    validQuestions,
    invalidQuestions
  };
}

/**
 * Parses an Excel (.xlsx / .xls) File object
 * Returns { questions, errors, totalRows, validRows, fileName, detectedUnitId }
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = parseExcelBuffer(e.target.result, file.name);
        resolve({
          ...result,
          fileSize: file.size
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file. Please check file permissions.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
