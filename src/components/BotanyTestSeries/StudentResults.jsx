import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCbtSubmissionsForUser } from '../../utils/botanyFirestoreService';
import { getDeviceCbtResults } from '../../utils/botanyResultsStorage';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return 'Time unavailable';
  if (Number(seconds) < 60) return 'Under 1 min';
  return `${Math.round(Number(seconds) / 60)} min`;
}

function mergeResults(deviceResults, accountResults) {
  const results = new Map();
  deviceResults.forEach(result => results.set(result.submissionId, result));
  accountResults.forEach(result => {
    const deviceResult = results.get(result.submissionId);
    results.set(result.submissionId, { ...deviceResult, ...result, answerReview: deviceResult?.answerReview || result.answerReview });
  });
  return [...results.values()].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

export default function StudentResults({ onStartDemo, onSignIn, refreshKey }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || 'guest';
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const deviceResults = getDeviceCbtResults(userId);
    setResults(deviceResults);
    setSelectedId(null);
    setLoadError(false);

    if (!currentUser?.uid) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    getCbtSubmissionsForUser(currentUser.uid)
      .then(accountResults => {
        if (active) setResults(mergeResults(deviceResults, accountResults));
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [currentUser?.uid, userId, refreshKey]);

  const selectedResult = results.find(result => result.submissionId === selectedId);

  return (
    <div className="explorer-content-card student-results-panel">
      <div className="content-card-header">
        <div>
          <h3>My Results</h3>
          <p>See your scores and review past answers.</p>
        </div>
      </div>

      {!currentUser && (
        <div className="results-note">
          <span>Free test results are saved on this device. Sign in to save future results to your account.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSignIn}>Sign In</button>
        </div>
      )}
      {loadError && <p className="results-load-note" role="status">Account results are unavailable right now. Showing results saved on this device.</p>}
      {currentUser && !loadError && <p className="results-load-note">Scores are saved to your account. Detailed answers stay on the device used for the test.</p>}
      {loading && <p className="results-load-note" role="status">Loading results...</p>}

      {!loading && results.length === 0 && (
        <div className="results-empty-state">
          <BookOpen size={26} />
          <strong>No results yet</strong>
          <span>Take the free practice test to get started.</span>
          <button type="button" className="btn btn-primary" onClick={onStartDemo}><Play size={15} /> Start Free Test</button>
        </div>
      )}

      {selectedResult ? (
        <div className="results-detail">
          <button type="button" className="btn btn-secondary btn-sm results-back-btn" onClick={() => setSelectedId(null)}>
            <ArrowLeft size={15} /> All Results
          </button>
          <div className="results-detail-summary">
            <div>
              <span className="results-date">{formatDate(selectedResult.savedAt)}</span>
              <h4>{selectedResult.testTitle || 'Botany Test'}</h4>
              <p>{selectedResult.correctCount || 0} correct · {selectedResult.incorrectCount || 0} wrong · {selectedResult.unattemptedCount || 0} skipped</p>
            </div>
            <strong className="results-score">{Number(selectedResult.score || 0).toFixed(2)} <small>/ {selectedResult.totalQuestions || 0}</small></strong>
          </div>

          {selectedResult.answerReview?.length ? (
            <div className="results-answer-list">
              <h4>Review Answers</h4>
              {selectedResult.answerReview.map((item, index) => (
                <article className="results-answer-card" key={`${item.questionId || index}-${index}`}>
                  <div className="results-question-top">
                    <span>Question {index + 1}</span>
                    <strong className={item.selectedOption === item.correctOption ? 'is-correct' : item.selectedOption ? 'is-wrong' : 'is-skipped'}>
                      {item.selectedOption === item.correctOption ? 'Correct' : item.selectedOption ? 'Wrong' : 'Skipped'}
                    </strong>
                  </div>
                  <p className="results-question-text">{item.question}</p>
                  <div className="results-options">
                    {['A', 'B', 'C', 'D'].filter(option => item.options?.[option]).map(option => (
                      <div className={`results-option ${option === item.correctOption ? 'is-correct' : option === item.selectedOption ? 'is-wrong' : ''}`} key={option}>
                        <b>{option}</b><span>{item.options[option]}</span>
                        {option === item.correctOption && <small>Correct answer</small>}
                        {option === item.selectedOption && option !== item.correctOption && <small>Your answer</small>}
                        {item.analyses?.[option] && <p className="results-option-reason"><strong>Why:</strong> {item.analyses[option]}</p>}
                      </div>
                    ))}
                  </div>
                  {item.referenceNote && <p className="results-extra-note">{item.referenceNote}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="results-load-note">This result has a score summary. Detailed answers are available on the device used for the test.</p>
          )}
        </div>
      ) : results.length > 0 ? (
        <div className="results-list">
          {results.map(result => (
            <article className="results-list-card" key={result.submissionId}>
              <span className="results-date">{formatDate(result.savedAt)}</span>
              <h4>{result.testTitle || 'Botany Test'}</h4>
              <div className="results-list-stats">
                <span><CheckCircle2 size={14} /> {result.correctCount || 0} correct</span>
                <span><Clock size={14} /> {formatDuration(result.timeTakenSeconds)}</span>
              </div>
              <div className="results-list-footer">
                <strong>{Number(result.score || 0).toFixed(2)} <small>/ {result.totalQuestions || 0}</small></strong>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedId(result.submissionId)}>
                  View Result
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
