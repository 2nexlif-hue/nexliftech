import * as XLSX from 'xlsx';

// Standard expected column headers
export const EXCEL_COLUMNS = [
  { key: 'question', label: 'Question', width: 45 },
  { key: 'optionA', label: 'Option A', width: 25 },
  { key: 'optionB', label: 'Option B', width: 25 },
  { key: 'optionC', label: 'Option C', width: 25 },
  { key: 'optionD', label: 'Option D', width: 25 },
  { key: 'correctOption', label: 'Correct Option (A/B/C/D)', width: 22 },
  { key: 'analysisA', label: 'Analysis Option A', width: 35 },
  { key: 'analysisB', label: 'Analysis Option B', width: 35 },
  { key: 'analysisC', label: 'Analysis Option C', width: 35 },
  { key: 'analysisD', label: 'Analysis Option D', width: 35 },
  { key: 'referenceNote', label: 'General Note / Exam Tip', width: 30 }
];

// Sample questions tailored to Botany Assistant Professor exam
const SAMPLE_QUESTIONS_BY_UNIT = {
  unit_1: [
    {
      question: 'Which of the following plant viruses possesses a circular double-stranded DNA genome with discontinuous strands (gaps)?',
      optionA: 'Tobacco Mosaic Virus (TMV)',
      optionB: 'Cauliflower Mosaic Virus (CaMV)',
      optionC: 'Turnip Yellow Mosaic Virus (TYMV)',
      optionD: 'Potato Virus X (PVX)',
      correctOption: 'B',
      analysisA: 'Incorrect. TMV has a single-stranded positive-sense RNA genome (~6.4 kb).',
      analysisB: 'Correct. CaMV is a pararetrovirus containing open circular dsDNA with site-specific discontinuities/gaps.',
      analysisC: 'Incorrect. TYMV has a positive-sense single-stranded RNA genome enclosed in an icosahedral capsid.',
      analysisD: 'Incorrect. PVX is a potexvirus having a single-stranded positive-sense RNA genome.',
      referenceNote: 'CaMV replicates via reverse transcription of 35S pregenomic RNA using host RNA polymerase II.'
    },
    {
      question: 'In Carl Woese\'s Three-Domain classification, the archaebacterial cell membrane is uniquely characterized by:',
      optionA: 'Ester-linked unbranched fatty acids',
      optionB: 'Ether-linked branched phytanyl isoprenoid chains',
      optionC: 'Peptidoglycan containing muramic acid',
      optionD: 'Cellulose and chitin microfibrils',
      correctOption: 'B',
      analysisA: 'Incorrect. Ester-linked unbranched fatty acids are characteristic of Eukarya and Eubacteria.',
      analysisB: 'Correct. Archaea uniquely possess branched phytanyl chains connected to glycerol via ether linkages, forming heat-stable monolayers or bilayers.',
      analysisC: 'Incorrect. Archaebacterial cell walls lack peptidoglycan (muramic acid); some possess pseudomurein.',
      analysisD: 'Incorrect. Cellulose and chitin occur in plant and fungal cell walls, respectively.',
      referenceNote: 'Ether bonds provide extreme resistance to high temperatures, hypersaline, and acidic pH conditions.'
    }
  ]
};

/**
 * Downloads a pre-formatted Excel template with sample rows and guidance
 */
export function downloadExcelTemplate(unitId = 'unit_1', unitTitle = 'Unit 1') {
  const samples = SAMPLE_QUESTIONS_BY_UNIT[unitId] || SAMPLE_QUESTIONS_BY_UNIT['unit_1'];

  const rows = samples.map((q) => ({
    'Question': q.question,
    'Option A': q.optionA,
    'Option B': q.optionB,
    'Option C': q.optionC,
    'Option D': q.optionD,
    'Correct Option (A/B/C/D)': q.correctOption,
    'Analysis Option A': q.analysisA,
    'Analysis Option B': q.analysisB,
    'Analysis Option C': q.analysisC,
    'Analysis Option D': q.analysisD,
    'General Note / Exam Tip': q.referenceNote
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = EXCEL_COLUMNS.map(col => ({ wch: col.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Question Bank');

  const safeUnitName = unitTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Template_${safeUnitName}_Questions.xlsx`);
}

/**
 * Exports any saved question list to a downloadable Excel file
 */
export function exportQuestionsToExcel(questions, unitTitle = 'Unit', version = 1) {
  if (!questions || !questions.length) {
    throw new Error('No questions to export.');
  }

  const rows = questions.map((q, idx) => ({
    'S.No': idx + 1,
    'Question': q.question || '',
    'Option A': q.optionA || '',
    'Option B': q.optionB || '',
    'Option C': q.optionC || '',
    'Option D': q.optionD || '',
    'Correct Option (A/B/C/D)': (q.correctOption || '').toUpperCase(),
    'Analysis Option A': q.analysisA || '',
    'Analysis Option B': q.analysisB || '',
    'Analysis Option C': q.analysisC || '',
    'Analysis Option D': q.analysisD || '',
    'General Note / Exam Tip': q.referenceNote || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 8 }, ...EXCEL_COLUMNS.map(col => ({ wch: col.width }))];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

  const safeTitle = unitTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${safeTitle}_v${version}_Questions.xlsx`);
}

function cleanKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[\u2013\u2014\-_/]/g, ' ')
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

  const question = getVal(['question', 'question text', 'q', 'item', 'statement', 'question statement']);
  const optionA = getVal(['option a', 'optiona', 'opt a', 'a']);
  const optionB = getVal(['option b', 'optionb', 'opt b', 'b']);
  const optionC = getVal(['option c', 'optionc', 'opt c', 'c']);
  const optionD = getVal(['option d', 'optiond', 'opt d', 'd']);
  
  let correctRaw = getVal(['correct answer', 'correct option', 'correct option (a/b/c/d)', 'answer', 'correct', 'ans']);
  let correctOption = '';

  if (correctRaw) {
    const cleaned = correctRaw.trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(cleaned)) {
      correctOption = cleaned;
    } else if (cleaned.startsWith('OPTION')) {
      const char = cleaned.replace('OPTION', '').trim()[0];
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

  const analysisA = getVal(['analysis option a', 'analysis a', 'opt a analysis', 'why a', 'option a analysis']);
  const analysisB = getVal(['analysis option b', 'analysis b', 'opt b analysis', 'why b', 'option b analysis']);
  const analysisC = getVal(['analysis option c', 'analysis c', 'opt c analysis', 'why c', 'option c analysis']);
  const analysisD = getVal(['analysis option d', 'analysis d', 'opt d analysis', 'why d', 'option d analysis']);
  const referenceNote = getVal([
    'brief context note', 'context note', 'general note / exam tip', 
    'general note', 'explanation', 'note', 'exam tip', 'reference note', 'brief note', 'rationale'
  ]);

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
  const unitMatch = fileName.match(/unit[_\s-]?0?(\d+)/i);
  if (unitMatch && unitMatch[1]) {
    detectedUnitId = `unit_${parseInt(unitMatch[1], 10)}`;
  }

  const parsedQuestions = rawJson.map((row, idx) => normalizeRow(row, idx));
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

