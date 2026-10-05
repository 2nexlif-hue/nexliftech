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
 * Fetch active questions for a specific unit
 */
export async function getUnitQuestions(unitId) {
  try {
    const docRef = doc(db, 'botany_question_banks', unitId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return {
      unitId,
      version: 0,
      totalQuestions: 0,
      questions: [],
      lastUpdated: null
    };
  } catch (err) {
    console.error(`Error loading questions for ${unitId}:`, err);
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
