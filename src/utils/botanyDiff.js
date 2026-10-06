import { levenshteinDistance } from './botanySearch';

/**
 * Normalizes text for clean comparison.
 */
function norm(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Calculates similarity between two strings (0 to 1).
 */
function textSimilarity(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(na, nb);
  return Math.max(0, 1 - (dist / maxLen));
}

/**
 * Compares an existing question against a new question and detects field differences.
 */
function detectQuestionFieldChanges(oldQ, newQ) {
  const changes = [];

  // Question statement
  if (norm(oldQ.question) !== norm(newQ.question)) {
    changes.push({
      field: 'Question Statement',
      type: 'text',
      oldVal: oldQ.question,
      newVal: newQ.question
    });
  }

  // Options
  ['A', 'B', 'C', 'D'].forEach(opt => {
    const key = `option${opt}`;
    if (norm(oldQ[key]) !== norm(newQ[key])) {
      changes.push({
        field: `Option ${opt}`,
        type: 'option',
        optionKey: opt,
        oldVal: oldQ[key],
        newVal: newQ[key]
      });
    }
  });

  // Correct Option (Answer Key)
  const oldKey = (oldQ.correctOption || '').toUpperCase().trim();
  const newKey = (newQ.correctOption || '').toUpperCase().trim();
  if (oldKey !== newKey) {
    changes.push({
      field: 'Correct Answer Key',
      type: 'key',
      oldVal: `Option ${oldKey || 'None'}`,
      newVal: `Option ${newKey || 'None'}`
    });
  }

  // Analysis / Explanations
  ['A', 'B', 'C', 'D'].forEach(opt => {
    const key = `analysis${opt}`;
    if (norm(oldQ[key]) !== norm(newQ[key]) && (oldQ[key] || newQ[key])) {
      changes.push({
        field: `Analysis - Option ${opt}`,
        type: 'analysis',
        oldVal: oldQ[key] || '(None)',
        newVal: newQ[key] || '(None)'
      });
    }
  });

  // Context Note / Reference
  if (norm(oldQ.referenceNote) !== norm(newQ.referenceNote) && (oldQ.referenceNote || newQ.referenceNote)) {
    changes.push({
      field: 'Syllabus Context Note',
      type: 'note',
      oldVal: oldQ.referenceNote || '(None)',
      newVal: newQ.referenceNote || '(None)'
    });
  }

  return changes;
}

/**
 * Computes a detailed diff between an existing question bank and a newly uploaded question list.
 * Identifies:
 * - Added questions (new)
 * - Modified questions (with specific field changes)
 * - Unchanged questions
 * - Deleted questions (present in old version but absent in new)
 */
export function computeQuestionBankDiff(existingQuestions = [], newQuestions = [], existingVersion = 1) {
  const oldList = Array.isArray(existingQuestions) ? existingQuestions : [];
  const newList = Array.isArray(newQuestions) ? newQuestions : [];

  // If there are no existing questions, all valid new questions are 'added'
  if (oldList.length === 0) {
    return {
      existingVersion: 0,
      targetVersion: 1,
      totalExisting: 0,
      totalNew: newList.length,
      hasExistingBank: false,
      addedCount: newList.length,
      modifiedCount: 0,
      deletedCount: 0,
      unchangedCount: 0,
      hasChanges: true,
      diffQuestions: newList.map((q, idx) => ({
        ...q,
        diffStatus: 'added',
        diffChanges: [],
        previousQuestion: null,
        displayIndex: idx + 1
      })),
      deletedQuestions: []
    };
  }

  const matchedOldIndices = new Set();
  const diffQuestions = [];

  // Pass 1: Try exact match by question text
  newList.forEach((newQ, newIdx) => {
    let matchedOldIdx = -1;

    // Check exact question match
    for (let i = 0; i < oldList.length; i++) {
      if (!matchedOldIndices.has(i) && norm(oldList[i].question) === norm(newQ.question)) {
        matchedOldIdx = i;
        break;
      }
    }

    // Pass 2: If no exact match, check by sNo (serial number) if text is reasonably close (similarity > 0.45)
    if (matchedOldIdx === -1) {
      const targetSNo = newQ.sNo || (newIdx + 1);
      for (let i = 0; i < oldList.length; i++) {
        if (!matchedOldIndices.has(i)) {
          const oldSNo = oldList[i].sNo || (i + 1);
          if (oldSNo === targetSNo) {
            const sim = textSimilarity(oldList[i].question, newQ.question);
            // If same question slot and some text similarity or same correct answer
            if (sim >= 0.4 || oldList[i].correctOption === newQ.correctOption) {
              matchedOldIdx = i;
              break;
            }
          }
        }
      }
    }

    // Pass 3: Check highest text similarity across remaining old questions
    if (matchedOldIdx === -1) {
      let highestSim = 0;
      let bestIdx = -1;
      for (let i = 0; i < oldList.length; i++) {
        if (!matchedOldIndices.has(i)) {
          const sim = textSimilarity(oldList[i].question, newQ.question);
          if (sim > highestSim && sim >= 0.55) {
            highestSim = sim;
            bestIdx = i;
          }
        }
      }
      if (bestIdx !== -1) {
        matchedOldIdx = bestIdx;
      }
    }

    if (matchedOldIdx !== -1) {
      matchedOldIndices.add(matchedOldIdx);
      const oldQ = oldList[matchedOldIdx];
      const changes = detectQuestionFieldChanges(oldQ, newQ);

      if (changes.length > 0) {
        diffQuestions.push({
          ...newQ,
          diffStatus: 'modified',
          diffChanges: changes,
          previousQuestion: oldQ,
          displayIndex: newIdx + 1
        });
      } else {
        diffQuestions.push({
          ...newQ,
          diffStatus: 'unchanged',
          diffChanges: [],
          previousQuestion: oldQ,
          displayIndex: newIdx + 1
        });
      }
    } else {
      // No match found in old version => Added
      diffQuestions.push({
        ...newQ,
        diffStatus: 'added',
        diffChanges: [],
        previousQuestion: null,
        displayIndex: newIdx + 1
      });
    }
  });

  // Identify Deleted questions (questions in old version that were never matched)
  const deletedQuestions = [];
  oldList.forEach((oldQ, oldIdx) => {
    if (!matchedOldIndices.has(oldIdx)) {
      deletedQuestions.push({
        ...oldQ,
        diffStatus: 'deleted',
        displayIndex: oldIdx + 1
      });
    }
  });

  const addedCount = diffQuestions.filter(q => q.diffStatus === 'added').length;
  const modifiedCount = diffQuestions.filter(q => q.diffStatus === 'modified').length;
  const unchangedCount = diffQuestions.filter(q => q.diffStatus === 'unchanged').length;
  const deletedCount = deletedQuestions.length;

  const currentVer = Number(existingVersion) || 1;
  const targetVer = currentVer + 1;

  return {
    existingVersion: currentVer,
    targetVersion: targetVer,
    totalExisting: oldList.length,
    totalNew: newList.length,
    hasExistingBank: true,
    addedCount,
    modifiedCount,
    deletedCount,
    unchangedCount,
    hasChanges: addedCount > 0 || modifiedCount > 0 || deletedCount > 0,
    diffQuestions,
    deletedQuestions
  };
}
