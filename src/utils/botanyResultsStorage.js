const RESULT_KEY_PREFIX = 'botany_cbt_results_v1_';

function getStorageKey(userId) {
  return `${RESULT_KEY_PREFIX}${userId || 'guest'}`;
}

export function getDeviceCbtResults(userId) {
  try {
    const stored = window.localStorage.getItem(getStorageKey(userId));
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item?.submissionId) : [];
  } catch {
    return [];
  }
}

export function saveDeviceCbtResult(userId, result) {
  try {
    const results = getDeviceCbtResults(userId);
    const withoutCurrent = results.filter(item => item.submissionId !== result.submissionId);
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify([result, ...withoutCurrent]));
    return true;
  } catch {
    return false;
  }
}
