import { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, ArrowLeft, ArrowRight, Bookmark, 
  RotateCcw, Award, Check, X, HelpCircle, BookOpen, LayoutGrid, CheckCircle2, Lock 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveCbtSubmission } from '../../utils/botanyFirestoreService';
import './BotanySeries.css';

export default function StudentExamEngine({ 
  testData, 
  questions = [], 
  onClose, 
  onUnlockNeeded, 
  userSubscriptions = [] 
}) {
  const { currentUser, userProfile } = useAuth();

  // Guardrail check: Only Test 1 (Diagnostic Demo) is free; Tests 2-35 require active subscription
  const isFreeDemo = (
    testData?.testNumber === 'T-1' || 
    testData?.id === 'diagnostic_demo' || 
    testData?.id === 'test_01' || 
    testData?.category === 'Diagnostic Test'
  );

  const emailLower = currentUser?.email?.toLowerCase().trim() || '';
  const isFacultyAdmin = (
    emailLower === 'e.educational.24@gmail.com' ||
    emailLower === 'admin@nexliftech.com' ||
    emailLower === '2nexlif@gmail.com' ||
    userProfile?.role === 'botany_admin' ||
    userProfile?.role === 'admin'
  );

  const hasFullAccess = Boolean(
    isFacultyAdmin ||
    userProfile?.hasActiveBotanySeries ||
    userSubscriptions.some(s => s.allowedUnits?.includes('all') || s.planType === 'full_series')
  );

  let hasAccess = isFreeDemo || hasFullAccess;
  if (!hasAccess) {
    const unitMatch = testData?.unitCovered?.match(/Unit\s*(\d+)/i);
    if (unitMatch) {
      const unitId = `unit_${unitMatch[1]}`;
      hasAccess = userSubscriptions.some(s => s.allowedUnits?.includes(unitId));
    }
  }

  // Test state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: 'A' | 'B' | 'C' | 'D' }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: true }
  const [secondsRemaining, setSecondsRemaining] = useState((testData?.durationMinutes || 60) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, secondsRemaining]);

  function formatTime(secs) {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const currentQ = questions[currentIdx] || null;

  function selectOption(optChar) {
    if (!currentQ || isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optChar }));
  }

  function clearResponse() {
    if (!currentQ || isSubmitted) return;
    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  }

  function toggleMarkForReview() {
    if (!currentQ || isSubmitted) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  }

  async function handleSubmitTest() {
    setShowConfirmSubmit(false);
    setIsSubmitted(true);

    // Compute evaluation results
    let cCount = 0;
    let iCount = 0;
    let uCount = 0;

    questions.forEach(q => {
      const selected = userAnswers[q.id];
      if (!selected) {
        uCount++;
      } else if (selected === q.correctOption) {
        cCount++;
      } else {
        iCount++;
      }
    });

    const calculatedScore = (cCount * 1) - (iCount * 0.25);
    const calculatedAccuracy = (cCount + iCount) > 0 ? Math.round((cCount / (cCount + iCount)) * 100) : 0;

    // Save submission to Firestore
    try {
      const saved = await saveCbtSubmission({
        userId: currentUser?.uid || 'guest_candidate',
        userEmail: currentUser?.email || 'guest@nexliftech.com',
        userName: currentUser?.displayName || userProfile?.displayName || 'Candidate',
        testId: testData?.id || testData?.testNumber || 'diagnostic_demo',
        testTitle: testData?.title || 'Botany Diagnostic Test',
        unitCovered: testData?.unitCovered || 'All Units',
        totalQuestions: questions.length,
        correctCount: cCount,
        incorrectCount: iCount,
        unattemptedCount: uCount,
        score: calculatedScore,
        accuracy: calculatedAccuracy,
        timeTakenSeconds: ((testData?.durationMinutes || 60) * 60) - secondsRemaining
      });
      if (saved?.submissionId) {
        setSubmissionId(saved.submissionId);
      }
    } catch (err) {
      console.warn('Submission record error:', err);
    }
  }

  function handleReattempt() {
    setUserAnswers({});
    setMarkedForReview({});
    setCurrentIdx(0);
    setSecondsRemaining((testData?.durationMinutes || 60) * 60);
    setSubmissionId(null);
    setIsSubmitted(false);
  }

  // Calculate score & statistics
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  if (isSubmitted) {
    questions.forEach(q => {
      const selected = userAnswers[q.id];
      if (!selected) {
        unattemptedCount++;
      } else if (selected === q.correctOption) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
  }

  const score = (correctCount * 1) - (incorrectCount * 0.25); // Standard PSC negative marking (0.25)
  const accuracy = (correctCount + incorrectCount) > 0 
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
    : 0;

  if (!hasAccess) {
    return (
      <div className="cbt-modal-fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="auth-modal-card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={28} />
          </div>

          <span className="unit-badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
            Premium Examination Content
          </span>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Subscription Pass Required
          </h2>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            <strong>{testData?.title || 'This Test'}</strong> ({testData?.unitCovered || 'PSC Syllabus'}) is restricted under official examination guardrails. To attempt this test with timed simulation, rank scoring, and option-by-option rationale, please unlock your Candidate Pass.
          </p>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Full 10 Units PSC Syllabus Coverage (35 Tests, 9 Grand Mocks)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Option-by-option scientific explanation curated by Dr. Aubid Ahmad</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Official tax invoice & email confirmation delivered instantly</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
              onClick={() => {
                if (onUnlockNeeded) {
                  onUnlockNeeded(testData);
                } else {
                  onClose();
                }
              }}
            >
              <span>Unlock Pass & Subscribe via Razorpay</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onClose}
            >
              Back to Test Calendar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cbt-modal-fullscreen">
      {/* Top CBT Header Bar */}
      <header className="cbt-topbar">
        <div className="cbt-topbar-left">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            <ArrowLeft size={14} /> <span>Exit CBT</span>
          </button>
          <div className="cbt-test-info">
            <h2>{testData?.title || 'Botany Entrance CBT Simulation'}</h2>
            <span>{testData?.unitCovered || 'PSC Entrance Syllabus'}</span>
          </div>
        </div>

        <div className="cbt-topbar-right">
          {!isSubmitted && (
            <div className={`cbt-timer ${secondsRemaining < 300 ? 'urgent' : ''}`}>
              <Clock size={16} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}
          {!isSubmitted ? (
            <button 
              type="button" 
              className="btn btn-primary btn-sm cbt-submit-btn"
              onClick={() => setShowConfirmSubmit(true)}
            >
              Submit Test
            </button>
          ) : (
            <span className="cbt-badge-completed">Completed</span>
          )}
        </div>
      </header>

      {/* Main Examination Canvas */}
      {!isSubmitted ? (
        <div className="cbt-body-layout">
          {/* Question Area */}
          <main className="cbt-question-pane">
            {currentQ ? (
              <>
                <div className="cbt-question-header">
                  <span className="cbt-q-badge">Question {currentIdx + 1} of {questions.length}</span>
                  <span className="cbt-marks-badge">+1.0 / -0.25</span>
                </div>

                <div className="cbt-question-body">
                  <p className="cbt-question-text">{currentQ.question}</p>

                  <div className="cbt-options-list">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const text = currentQ[`option${opt}`];
                      if (!text) return null;
                      const isSelected = userAnswers[currentQ.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`cbt-option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => selectOption(opt)}
                        >
                          <span className="cbt-opt-char">{opt}</span>
                          <span className="cbt-opt-text">{text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <footer className="cbt-question-footer">
                  <div className="cbt-footer-left">
                    <button 
                      type="button" 
                      className={`btn btn-secondary btn-sm cbt-footer-btn ${markedForReview[currentQ.id] ? 'is-marked' : ''}`}
                      onClick={toggleMarkForReview}
                    >
                      <Bookmark size={13} />
                      <span>{markedForReview[currentQ.id] ? 'Marked' : 'Review'}</span>
                    </button>
                    {userAnswers[currentQ.id] && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm cbt-footer-btn"
                        onClick={clearResponse}
                      >
                        <RotateCcw size={13} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <div className="cbt-footer-center">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm cbt-footer-btn cbt-mobile-palette-toggle"
                      onClick={() => setShowMobilePalette(!showMobilePalette)}
                      aria-label="Toggle Question Palette"
                    >
                      <LayoutGrid size={13} />
                      <span>Q-Palette ({currentIdx + 1}/{questions.length})</span>
                    </button>
                  </div>

                  <div className="cbt-footer-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm cbt-footer-btn"
                      onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                    >
                      <ArrowLeft size={13} /> <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm cbt-footer-btn"
                      onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIdx === questions.length - 1}
                    >
                      <span>Next</span> <ArrowRight size={13} />
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No questions loaded for this test.
              </div>
            )}
          </main>

          {/* Palette Sidebar (Desktop) & Bottom Sheet Drawer (Mobile) */}
          <aside className={`cbt-palette-pane ${showMobilePalette ? 'mobile-open' : ''}`}>
            <div className="cbt-palette-drawer-header">
              <h4 className="cbt-palette-heading">Question Palette ({questions.length} Qs)</h4>
              <button 
                type="button" 
                className="cbt-palette-close-btn"
                onClick={() => setShowMobilePalette(false)}
                aria-label="Close palette"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cbt-palette-legend">
              <div className="legend-item"><span className="legend-dot green"></span> Ans ({Object.keys(userAnswers).length})</div>
              <div className="legend-item"><span className="legend-dot purple"></span> Review ({Object.values(markedForReview).filter(Boolean).length})</div>
              <div className="legend-item"><span className="legend-dot grey"></span> Unattempted ({questions.length - Object.keys(userAnswers).length})</div>
            </div>

            <div className="cbt-palette-grid">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!userAnswers[q.id];
                const isMarked = !!markedForReview[q.id];

                let statusClass = 'unattempted';
                if (isAnswered) statusClass = 'answered';
                else if (isMarked) statusClass = 'marked';

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    className={`cbt-palette-btn ${statusClass} ${isCurrent ? 'current' : ''}`}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowMobilePalette(false);
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {showMobilePalette && (
            <div 
              className="cbt-palette-backdrop" 
              onClick={() => setShowMobilePalette(false)}
            ></div>
          )}
        </div>
      ) : (
        /* Post-Submission Scorecard & Option-By-Option Scientific Review */
        <main className="cbt-results-container">
          <div className="cbt-scorecard glass-panel">
            <div className="scorecard-header">
              <div className="scorecard-icon">
                <Award size={36} />
              </div>
              <div>
                <h2>Test Completed &amp; Evaluated</h2>
                <p>Evaluation with +1.0 for correct and -0.25 negative marking</p>
              </div>
            </div>

            <div className="scorecard-metrics">
              <div className="metric-box">
                <span className="metric-label">Calculated Score</span>
                <span className="metric-value">{score.toFixed(2)}</span>
                <span className="metric-sub">Out of {questions.length}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{accuracy}%</span>
                <span className="metric-sub">Correct vs Attempted</span>
              </div>
              <div className="metric-box green">
                <span className="metric-label">Correct</span>
                <span className="metric-value">{correctCount}</span>
                <span className="metric-sub">Questions</span>
              </div>
              <div className="metric-box red">
                <span className="metric-label">Incorrect</span>
                <span className="metric-value">{incorrectCount}</span>
                <span className="metric-sub">-0.25 penalty</span>
              </div>
              <div className="metric-box grey">
                <span className="metric-label">Unattempted</span>
                <span className="metric-value">{unattemptedCount}</span>
                <span className="metric-sub">0 marks</span>
              </div>
            </div>

            {/* Scorecard Action Bar */}
            <div className="scorecard-actions-bar">
              {submissionId && (
                <div className="submission-saved-tag">
                  <CheckCircle2 size={14} />
                  <span>Submission Recorded: <strong>{submissionId}</strong></span>
                </div>
              )}
              <div className="scorecard-btn-group">
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleReattempt}>
                  <RotateCcw size={13} />
                  <span>Re-attempt Test</span>
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
                  <ArrowLeft size={13} />
                  <span>Back to Portal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option-By-Option Detailed Scientific Analysis */}
          <div className="cbt-analysis-section">
            <div className="analysis-header">
              <BookOpen size={20} className="accent-icon" />
              <h3>Detailed Scientific Analysis &amp; Option Breakdown</h3>
            </div>

            <div className="analysis-list">
              {questions.map((q, idx) => {
                const userChoice = userAnswers[q.id];
                const isCorrect = userChoice === q.correctOption;
                const isSkipped = !userChoice;

                return (
                  <div key={q.id || idx} className={`analysis-card ${isCorrect ? 'correct' : isSkipped ? 'skipped' : 'incorrect'}`}>
                    <div className="analysis-card-top">
                      <span className="analysis-q-num">Q{idx + 1}.</span>
                      <div className="analysis-status-pill">
                        {isCorrect && <span className="pill green"><Check size={12} /> Correct (+1.0)</span>}
                        {!isCorrect && !isSkipped && <span className="pill red"><X size={12} /> Incorrect (-0.25)</span>}
                        {isSkipped && <span className="pill grey"><HelpCircle size={12} /> Not Attempted (0.0)</span>}
                      </div>
                    </div>

                    <p className="analysis-q-text">{q.question}</p>

                    {/* Options list with highlight */}
                    <div className="analysis-options-breakdown">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const optText = q[`option${opt}`];
                        const optAnalysis = q[`analysis${opt}`];
                        if (!optText) return null;
                        const isThisCorrect = q.correctOption === opt;
                        const isThisUserPick = userChoice === opt;

                        let rowClass = '';
                        if (isThisCorrect) rowClass = 'correct-opt';
                        else if (isThisUserPick) rowClass = 'wrong-opt';

                        return (
                          <div key={opt} className={`analysis-opt-row ${rowClass}`}>
                            <div className="opt-row-main">
                              <span className="opt-letter">{opt}</span>
                              <span className="opt-text-val">{optText}</span>
                              {isThisCorrect && <span className="tag-correct">Correct Answer</span>}
                              {isThisUserPick && !isThisCorrect && <span className="tag-user-wrong">Your Pick</span>}
                            </div>
                            {optAnalysis && (
                              <div className="opt-analysis-text">
                                <strong>Rationale:</strong> {optAnalysis}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.referenceNote && (
                      <div className="analysis-ref-tip">
                        <strong>Exam Tip / Reference Note:</strong> {q.referenceNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* Confirmation Dialog before submitting test */}
      {showConfirmSubmit && (
        <div className="botany-modal-overlay">
          <div className="botany-modal-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', margin: '0 auto 0.75rem auto' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Submit Test Confirmation</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              You have answered <strong>{Object.keys(userAnswers).length}</strong> of <strong>{questions.length}</strong> questions.
              <br />
              Are you sure you want to finish and submit your test?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Continue Test
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSubmitTest}
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
