import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { BOTANY_SYLLABUS, BOTANY_TEST_SCHEDULE, DEFAULT_SERIES_SETTINGS } from './botanyTestSeriesData';
import { BOTANY_SEED_QUESTION_BANKS } from './botanySeedQuestionBanks';

const SETTINGS_DOC = 'botany_test_series_settings';
const SYLLABUS_DOC = 'botany_syllabus';
const SCHEDULE_DOC = 'botany_schedule';

/**
 * Fetch or initialize Botany Series settings
 */
export async function getBotanySettings() {
  try {
    const docRef = doc(db, 'siteContent', SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SERIES_SETTINGS, ...snap.data() };
    }
    return DEFAULT_SERIES_SETTINGS;
  } catch (err) {
    console.error('Error fetching botany settings, falling back to default:', err);
    return DEFAULT_SERIES_SETTINGS;
  }
}

/**
 * Save Botany Series settings
 */
export async function saveBotanySettings(settings, userEmail = 'admin') {
  const docRef = doc(db, 'siteContent', SETTINGS_DOC);
  const payload = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Fetch Botany Syllabus from Firestore (or fallback to master seed)
 */
export async function getBotanySyllabus() {
  try {
    const docRef = doc(db, 'siteContent', SYLLABUS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.units?.length) {
      return snap.data().units;
    }
    return BOTANY_SYLLABUS;
  } catch (err) {
    console.error('Error fetching botany syllabus, fallback to local:', err);
    return BOTANY_SYLLABUS;
  }
}

/**
 * Save updated Botany Syllabus
 */
export async function saveBotanySyllabus(units, userEmail = 'admin') {
  const docRef = doc(db, 'siteContent', SYLLABUS_DOC);
  const payload = {
    units,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };
  await setDoc(docRef, payload);
  return units;
}

/**
 * Fetch Botany Schedule from Firestore (or fallback to master seed)
 */
export async function getBotanySchedule() {
  try {
    const docRef = doc(db, 'siteContent', SCHEDULE_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.schedule?.length) {
      return snap.data().schedule;
    }
    return BOTANY_TEST_SCHEDULE;
  } catch (err) {
    console.error('Error fetching botany schedule, fallback to local:', err);
    return BOTANY_TEST_SCHEDULE;
  }
}

/**
 * Save updated Botany Schedule
 */
export async function saveBotanySchedule(schedule, userEmail = 'admin') {
  const docRef = doc(db, 'siteContent', SCHEDULE_DOC);
  const payload = {
    schedule,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };
  await setDoc(docRef, payload);
  return schedule;
}

/**
 * Synchronize / seed default data to Firestore if not already present
 */
export async function syncBotanyDataToFirestore(userEmail = 'admin') {
  await Promise.all([
    saveBotanySettings(DEFAULT_SERIES_SETTINGS, userEmail),
    saveBotanySyllabus(BOTANY_SYLLABUS, userEmail),
    saveBotanySchedule(BOTANY_TEST_SCHEDULE, userEmail)
  ]);
  return true;
}

/**
 * Fetch active questions for a specific unit (with fallback to preloaded seed bank)
 */
export async function getUnitQuestions(unitId) {
  try {
    const docRef = doc(db, 'botany_question_banks', unitId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.questions?.length) {
      return snap.data();
    }
    if (BOTANY_SEED_QUESTION_BANKS && BOTANY_SEED_QUESTION_BANKS[unitId]) {
      return BOTANY_SEED_QUESTION_BANKS[unitId];
    }
    return {
      unitId,
      version: 0,
      totalQuestions: 0,
      questions: [],
      lastUpdated: null
    };
  } catch (err) {
    console.error(`Error loading questions for ${unitId}, using seed fallback:`, err);
    if (BOTANY_SEED_QUESTION_BANKS && BOTANY_SEED_QUESTION_BANKS[unitId]) {
      return BOTANY_SEED_QUESTION_BANKS[unitId];
    }
    return { unitId, version: 0, totalQuestions: 0, questions: [], lastUpdated: null };
  }
}

/**
 * Fetch the last 3 versions of a unit for rollback or download
 */
export async function getUnitVersions(unitId) {
  try {
    const versionsRef = collection(db, 'botany_question_banks', unitId, 'versions');
    const q = query(versionsRef, orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);
    const versions = [];
    snap.forEach((docItem) => {
      versions.push({ id: docItem.id, ...docItem.data() });
    });
    return versions.slice(0, 3);
  } catch (err) {
    console.error(`Error fetching versions for ${unitId}:`, err);
    return [];
  }
}

/**
 * Commit new questions to a unit, archiving previous version and maintaining max 3 previous versions
 */
export async function commitUnitQuestions({ unitId, unitTitle, questions, fileName, userEmail }) {
  const unitDocRef = doc(db, 'botany_question_banks', unitId);
  const currentSnap = await getDoc(unitDocRef);
  const now = new Date().toISOString();

  // If there's an existing active dataset with questions, archive it into versions subcollection
  if (currentSnap.exists() && currentSnap.data()?.questions?.length) {
    const currentData = currentSnap.data();
    const prevVersionNum = currentData.version || 1;
    const versionDocId = `v${prevVersionNum}_${Date.now()}`;
    const versionDocRef = doc(db, 'botany_question_banks', unitId, 'versions', versionDocId);

    await setDoc(versionDocRef, {
      versionNumber: prevVersionNum,
      fileName: currentData.fileName || `${unitId}_v${prevVersionNum}.xlsx`,
      questionCount: currentData.questions.length,
      questions: currentData.questions,
      uploadedAt: currentData.lastUpdated || now,
      uploadedBy: currentData.updatedBy || userEmail
    });

    // Prune versions older than the 3 most recent
    const versionsRef = collection(db, 'botany_question_banks', unitId, 'versions');
    const snap = await getDocs(query(versionsRef, orderBy('uploadedAt', 'desc')));
    const allVersions = [];
    snap.forEach(d => allVersions.push({ id: d.id, ...d.data() }));

    if (allVersions.length > 3) {
      const versionsToDelete = allVersions.slice(3);
      for (const v of versionsToDelete) {
        await deleteDoc(doc(db, 'botany_question_banks', unitId, 'versions', v.id));
      }
    }
  }

  // Determine new version number
  const nextVersion = (currentSnap.exists() ? (currentSnap.data()?.version || 0) : 0) + 1;

  // Set new active release
  const newActiveData = {
    unitId,
    unitTitle,
    version: nextVersion,
    fileName,
    totalQuestions: questions.length,
    questions,
    lastUpdated: now,
    updatedBy: userEmail
  };

  await setDoc(unitDocRef, newActiveData);
  return newActiveData;
}

/**
 * Rollback to a specific historical version
 */
export async function rollbackUnitToVersion({ unitId, versionItem, userEmail }) {
  const unitDocRef = doc(db, 'botany_question_banks', unitId);
  const currentSnap = await getDoc(unitDocRef);
  const now = new Date().toISOString();

  // Archive current active before rolling back
  if (currentSnap.exists() && currentSnap.data()?.questions?.length) {
    const currentData = currentSnap.data();
    const prevVersionNum = currentData.version || 1;
    const versionDocId = `v${prevVersionNum}_archived_before_rollback_${Date.now()}`;
    const versionDocRef = doc(db, 'botany_question_banks', unitId, 'versions', versionDocId);

    await setDoc(versionDocRef, {
      versionNumber: prevVersionNum,
      fileName: currentData.fileName || `${unitId}_v${prevVersionNum}.xlsx`,
      questionCount: currentData.questions.length,
      questions: currentData.questions,
      uploadedAt: currentData.lastUpdated || now,
      uploadedBy: `Archived during rollback by ${userEmail}`
    });
  }

  const restoredData = {
    unitId,
    unitTitle: versionItem.unitTitle || unitId,
    version: (versionItem.versionNumber || 1),
    isRollback: true,
    fileName: `Restored: ${versionItem.fileName}`,
    totalQuestions: versionItem.questions.length,
    questions: versionItem.questions,
    lastUpdated: now,
    updatedBy: userEmail
  };

  await setDoc(unitDocRef, restoredData);
  return restoredData;
}

/**
 * Resolves which unit indices (1..10) a schedule test covers
 */
export function resolveTestUnits(unitCovered) {
  if (!unitCovered) return [];
  const str = String(unitCovered).toLowerCase();
  if (str.includes('all 10') || str.includes('1–10') || str.includes('1-10') || str.includes('mock') || str.includes('diagnostic')) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  const matches = [...unitCovered.matchAll(/Unit\s*(\d+)/gi)].map(m => parseInt(m[1], 10));
  return [...new Set(matches.filter(n => n >= 1 && n <= 10))];
}

/**
 * Calculates question bank readiness statistics for a single schedule test
 */
export function getTestQuestionStats(testItem, unitStatsMap = {}) {
  const unitNumbers = resolveTestUnits(testItem.unitCovered);
  if (!unitNumbers.length) {
    return {
      hasBank: false,
      unitNumbers: [],
      uploadedCount: 0,
      targetCount: testItem.questionCount || 0,
      coveragePct: 0,
      analysisPct: 0,
      statusLabel: 'Review / Drill Day',
      statusType: 'neutral'
    };
  }

  let totalInBank = 0;
  let totalAnalysis = 0;
  let unitCount = 0;

  unitNumbers.forEach((num) => {
    const uStats = unitStatsMap[`unit_${num}`];
    if (uStats) {
      totalInBank += (uStats.questionCount || 0);
      totalAnalysis += (uStats.fourOptionAnalysisPct || 0);
      unitCount++;
    }
  });

  const avgAnalysis = unitCount > 0 ? Math.round(totalAnalysis / unitCount) : 0;
  const target = testItem.questionCount || 0;
  const coveragePct = target > 0 ? Math.min(100, Math.round((totalInBank / target) * 100)) : 100;

  let statusType = 'ready';
  let statusLabel = `${totalInBank} in Bank`;

  if (totalInBank === 0) {
    statusType = 'empty';
    statusLabel = 'Pending Upload';
  } else if (totalInBank >= target) {
    statusType = 'complete';
    statusLabel = `${totalInBank} Q Bank (100% Ready)`;
  } else {
    statusType = 'partial';
    statusLabel = `${totalInBank} in Bank (${coveragePct}%)`;
  }

  return {
    hasBank: true,
    unitNumbers,
    uploadedCount: totalInBank,
    targetCount: target,
    coveragePct,
    analysisPct: avgAnalysis,
    statusLabel,
    statusType
  };
}

/**
 * Aggregates complete Question Bank statistics across all units from Firestore
 * (with automatic fallback to validated seed question banks)
 */
export async function getAllUnitsQuestionStats(syllabus = BOTANY_SYLLABUS) {
  const unitsMap = {};
  
  // Try querying active question banks from Firestore
  const firestoreUnits = {};
  try {
    const colRef = collection(db, 'botany_question_banks');
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = d.data();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        firestoreUnits[d.id] = data;
      }
    });
  } catch (err) {
    console.warn('Firestore question banks fetch skipped/offline, using seed fallback:', err);
  }

  let totalUploadedQuestions = 0;
  let totalWithAll4Analysis = 0;
  let totalWithContextNote = 0;
  const overallKeyCounts = { A: 0, B: 0, C: 0, D: 0 };
  let unitsWithQuestions = 0;

  syllabus.forEach((unit) => {
    const unitId = unit.unitId;
    const fsData = firestoreUnits[unitId];
    const seedData = BOTANY_SEED_QUESTION_BANKS ? BOTANY_SEED_QUESTION_BANKS[unitId] : null;
    
    const activeData = (fsData && fsData.questions && fsData.questions.length > 0)
      ? fsData
      : (seedData || {
          unitId,
          version: 0,
          totalQuestions: 0,
          questions: [],
          lastUpdated: null,
          fileName: ''
        });

    const questions = activeData.questions || [];
    const count = questions.length;
    if (count > 0) unitsWithQuestions++;
    totalUploadedQuestions += count;

    let uAnalysisCount = 0;
    let uNoteCount = 0;
    const uKeyDist = { A: 0, B: 0, C: 0, D: 0 };

    questions.forEach((q) => {
      const key = (q.correctOption || '').trim().toUpperCase();
      if (overallKeyCounts[key] !== undefined) overallKeyCounts[key]++;
      if (uKeyDist[key] !== undefined) uKeyDist[key]++;

      const has4Analysis = Boolean(
        q.analysisA && q.analysisA.trim() &&
        q.analysisB && q.analysisB.trim() &&
        q.analysisC && q.analysisC.trim() &&
        q.analysisD && q.analysisD.trim()
      );
      if (has4Analysis) {
        uAnalysisCount++;
        totalWithAll4Analysis++;
      }

      if (q.referenceNote && q.referenceNote.trim()) {
        uNoteCount++;
        totalWithContextNote++;
      }
    });

    const targetCount = unit.estimatedQuestions || 50;
    const coveragePercent = Math.min(100, Math.round((count / targetCount) * 100));
    const analysisPct = count > 0 ? Math.round((uAnalysisCount / count) * 100) : 0;
    const contextPct = count > 0 ? Math.round((uNoteCount / count) * 100) : 0;

    unitsMap[unitId] = {
      unitId,
      unitNumber: unit.unitNumber,
      title: unit.title,
      shortTitle: unit.shortTitle || `Unit ${unit.unitNumber}`,
      questionCount: count,
      targetCount,
      coveragePercent,
      fourOptionAnalysisCount: uAnalysisCount,
      fourOptionAnalysisPct: analysisPct,
      contextNoteCount: uNoteCount,
      contextNotePct: contextPct,
      keyDistribution: uKeyDist,
      version: activeData.version || 1,
      fileName: activeData.fileName || `${unitId}.xlsx`,
      lastUpdated: activeData.lastUpdated,
      isSeedFallback: !fsData,
      questions
    };
  });

  const totalTargetQuestions = syllabus.length * 50; // 500
  const overallAnalysisPct = totalUploadedQuestions > 0 ? Math.round((totalWithAll4Analysis / totalUploadedQuestions) * 100) : 0;
  const overallContextPct = totalUploadedQuestions > 0 ? Math.round((totalWithContextNote / totalUploadedQuestions) * 100) : 0;
  const overallCoveragePct = Math.round((totalUploadedQuestions / totalTargetQuestions) * 100);

  return {
    totalUploadedQuestions,
    totalTargetQuestions,
    seriesTotalTarget: 2700,
    unitsLoadedCount: unitsWithQuestions,
    totalUnitsCount: syllabus.length,
    overallAnalysisPct,
    overallContextPct,
    overallCoveragePct,
    overallKeyDistribution: overallKeyCounts,
    unitStats: unitsMap
  };
}

/**
 * Commits all 10 pre-validated seed question banks (100 MCQs) into Firestore
 */
export async function commitAllSeedBanksToFirestore(userEmail = 'admin') {
  if (!BOTANY_SEED_QUESTION_BANKS) {
    throw new Error('Seed question banks data not found.');
  }

  const results = [];
  for (const unitId of Object.keys(BOTANY_SEED_QUESTION_BANKS)) {
    const bank = BOTANY_SEED_QUESTION_BANKS[unitId];
    const unitTitle = `Unit ${bank.unitNumber}: ${BOTANY_SYLLABUS.find(u => u.unitId === bank.unitId)?.title || bank.unitId}`;
    const res = await commitUnitQuestions({
      unitId: bank.unitId,
      unitTitle,
      questions: bank.questions,
      fileName: bank.fileName,
      userEmail
    });
    results.push(res);
  }
  return results;
}
