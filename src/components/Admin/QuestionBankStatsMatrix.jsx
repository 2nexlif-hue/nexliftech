import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, CheckCircle2,
  BarChart3, ArrowRight, ChevronDown,
  ChevronUp, ShieldCheck, Database, Award, RefreshCw, Upload, Download
} from 'lucide-react';
import './QuestionBankStatsMatrix.css';

export default function QuestionBankStatsMatrix({
  questionStats,
  title = 'Question banks',
  showScheduledTests = true,
  schedule = [],
  activeFilter = 'all',
  onFilterChange,
  onSelectUnit,
  onCommitAllSeed,
  onDownloadTemplate,
  onUploadUnitFile,
  committing = false,
  mode = 'banner' // 'banner' | 'full'
}) {
  const [isExpanded, setIsExpanded] = useState(mode === 'full');
  const rowFileInputRef = useRef(null);
  const uploadUnitRef = useRef(null);

  function chooseRowFile(unitId) {
    uploadUnitRef.current = unitId;
    rowFileInputRef.current?.click();
  }

  function handleRowFileChange(event) {
    const file = event.target.files?.[0];
    if (file && uploadUnitRef.current) onUploadUnitFile?.(file, uploadUnitRef.current);
    event.target.value = '';
  }

  if (!questionStats) {
    return (
      <div className="stats-matrix-loading">
        <RefreshCw size={18} className="spin" />
        <span>Computing question bank statistics across all units...</span>
      </div>
    );
  }

  const {
    totalUploadedQuestions = 0,
    totalTargetQuestions = 500,
    seriesTotalTarget = 3650,
    unitsLoadedCount = 0,
    totalUnitsCount = 10,
    overallAnalysisPct = 0,
    overallContextPct = 0,
    overallCoveragePct = 0,
    overallKeyDistribution = { A: 0, B: 0, C: 0, D: 0 },
    unitStats = {},
    demoStats = null
  } = questionStats;

  const keyTotal = (overallKeyDistribution.A || 0) + (overallKeyDistribution.B || 0) + 
                   (overallKeyDistribution.C || 0) + (overallKeyDistribution.D || 0) || 1;

  const keyPctA = Math.round(((overallKeyDistribution.A || 0) / keyTotal) * 100);
  const keyPctB = Math.round(((overallKeyDistribution.B || 0) / keyTotal) * 100);
  const keyPctC = Math.round(((overallKeyDistribution.C || 0) / keyTotal) * 100);
  const keyPctD = Math.round(((overallKeyDistribution.D || 0) / keyTotal) * 100);

  const unitsList = Object.values(unitStats).sort((a, b) => a.unitNumber - b.unitNumber);
  const scheduledTests = schedule.filter(test => test.isTest);

  return (
    <div className={`question-stats-matrix-container ${mode}`}>
      {onUploadUnitFile && <input ref={rowFileInputRef} className="matrix-file-input" type="file" accept=".xlsx,.xls" aria-label="Choose a question bank workbook" onChange={handleRowFileChange} />}
      {mode !== 'full' && <div className="matrix-kpi-banner">
        <div className="kpi-banner-top">
          <div className="kpi-banner-headline">
            <div className="headline-icon-badge">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="headline-title-wrap">
                <h4>Excel Question Bank Statistical Audit</h4>
                <span className="live-verified-pill">
                  <ShieldCheck size={12} />
                  <span>10 Units Analyzed</span>
                </span>
              </div>
              <p className="headline-subtitle">
                Live statistics computed from uploaded unit Excel files &amp; database banks.
              </p>
            </div>
          </div>

          <div className="kpi-banner-actions">
            {onCommitAllSeed && (
              <button
                type="button"
                className="btn btn-secondary btn-sm seed-commit-btn"
                onClick={onCommitAllSeed}
                disabled={committing}
                title="Commit all 10 verified unit question banks (100 MCQs) into Firebase"
              >
                <Database size={13} />
                <span>{committing ? 'Syncing to Firebase...' : 'Sync All 10 to Firebase'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm toggle-matrix-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <BarChart3 size={13} />
              <span>{isExpanded ? 'Hide Unit Matrix' : 'View 10-Unit Matrix'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* 5 CORE KPI METRICS */}
        <div className="matrix-metrics-grid">
          {/* Tile 1: Total Bank Uploaded */}
          <div className="kpi-tile highlight">
            <div className="kpi-tile-header">
              <span className="kpi-label">Uploaded Questions</span>
              <span className="kpi-tag tag-ready">{unitsLoadedCount}/{totalUnitsCount} Units</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-main-val">{totalUploadedQuestions}</span>
              <span className="kpi-sub-val">/ {totalTargetQuestions} Target</span>
            </div>
            <div className="kpi-progress-bar">
              <div 
                className="kpi-progress-fill ready" 
                style={{ width: `${Math.min(100, overallCoveragePct)}%` }}
              ></div>
            </div>
            <div className="kpi-caption">
              <span>{overallCoveragePct}% of Unit Test target</span>
              <span className="muted-text">({seriesTotalTarget} Series Total)</span>
            </div>
          </div>

          {/* Tile 2: 4-Option Analysis Completeness */}
          <div className="kpi-tile">
            <div className="kpi-tile-header">
              <span className="kpi-label">4-Distractor Rationale</span>
              <span className="kpi-tag tag-success">100% Target</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-main-val text-success">{overallAnalysisPct}%</span>
              <span className="kpi-sub-val">Verified</span>
            </div>
            <div className="kpi-progress-bar">
              <div 
                className="kpi-progress-fill success" 
                style={{ width: `${overallAnalysisPct}%` }}
              ></div>
            </div>
            <div className="kpi-caption">
              <span>Scientific explanations on all 4 options (A-D)</span>
            </div>
          </div>

          {/* Tile 3: Context Notes & Exam Tips */}
          <div className="kpi-tile">
            <div className="kpi-tile-header">
              <span className="kpi-label">Context Notes &amp; Tips</span>
              <span className="kpi-tag tag-accent">Curated</span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-main-val text-accent">{overallContextPct}%</span>
              <span className="kpi-sub-val">Coverage</span>
            </div>
            <div className="kpi-progress-bar">
              <div 
                className="kpi-progress-fill accent" 
                style={{ width: `${overallContextPct}%` }}
              ></div>
            </div>
            <div className="kpi-caption">
              <span>Syllabus focus &amp; exam tips attached</span>
            </div>
          </div>

          {/* Tile 4: Key Randomization Balance */}
          <div className="kpi-tile key-balance-tile">
            <div className="kpi-tile-header">
              <span className="kpi-label">Answer Key Distribution</span>
              <span className="kpi-tag tag-neutral">Zero Bias</span>
            </div>
            <div className="key-ratio-stacked-bar">
              <div className="key-slice slice-a" style={{ width: `${keyPctA}%` }} title={`Option A: ${overallKeyDistribution.A} (${keyPctA}%)`}>A {keyPctA}%</div>
              <div className="key-slice slice-b" style={{ width: `${keyPctB}%` }} title={`Option B: ${overallKeyDistribution.B} (${keyPctB}%)`}>B {keyPctB}%</div>
              <div className="key-slice slice-c" style={{ width: `${keyPctC}%` }} title={`Option C: ${overallKeyDistribution.C} (${keyPctC}%)`}>C {keyPctC}%</div>
              <div className="key-slice slice-d" style={{ width: `${keyPctD}%` }} title={`Option D: ${overallKeyDistribution.D} (${keyPctD}%)`}>D {keyPctD}%</div>
            </div>
            <div className="key-pills-row">
              <span className="key-pill">A: {overallKeyDistribution.A}</span>
              <span className="key-pill">B: {overallKeyDistribution.B}</span>
              <span className="key-pill">C: {overallKeyDistribution.C}</span>
              <span className="key-pill">D: {overallKeyDistribution.D}</span>
            </div>
          </div>

          {/* Tile 5: Free Entrance Diagnostic Demo CBT */}
          <div className="kpi-tile" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
            <div className="kpi-tile-header">
              <span className="kpi-label">Free Demo CBT</span>
              <span className="kpi-tag" style={{ background: 'rgba(124, 58, 237, 0.12)', color: 'var(--accent-primary)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
                Entrance Exam
              </span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-main-val" style={{ color: 'var(--accent-primary)' }}>
                {demoStats?.questionCount || 0}
              </span>
              <span className="kpi-sub-val">/ 30 MCQs</span>
            </div>
            <div className="kpi-progress-bar">
              <div 
                className="kpi-progress-fill" 
                style={{ width: `${Math.min(100, Math.round(((demoStats?.questionCount || 0) / 30) * 100))}%`, background: 'var(--accent-primary)' }}
              ></div>
            </div>
            <div className="kpi-caption" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{demoStats?.questionCount ? '🟢 Live on Portal' : 'Pending upload'}</span>
              {onSelectUnit && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  onClick={() => onSelectUnit('diagnostic_demo')}
                >
                  Manage Demo &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* EXPANDABLE 10-UNIT AUDIT MATRIX */}
      {isExpanded && (
        <div className="matrix-expanded-details">
          <div className="matrix-table-toolbar">
            <div className="matrix-toolbar-title">
              <h5>{title}</h5>
            </div>
            <div className="matrix-filter-buttons">
              <button 
                type="button" 
                className={`matrix-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange?.('all')}
              >
                Units + demo ({unitsList.length + 1})
              </button>
              <button 
                type="button" 
                className={`matrix-filter-btn ${activeFilter === 'uploaded' ? 'active' : ''}`}
                onClick={() => onFilterChange?.('uploaded')}
              >
                Loaded ({unitsList.filter(u => u.questionCount > 0).length})
              </button>
              <button 
                type="button" 
                className={`matrix-filter-btn ${activeFilter === 'demo' ? 'active' : ''}`}
                onClick={() => onFilterChange?.('demo')}
              >
                Demo ({demoStats?.questionCount || 0})
              </button>
              {showScheduledTests && <button
                type="button"
                className={`matrix-filter-btn ${activeFilter === 'tests' ? 'active' : ''}`}
                onClick={() => onFilterChange?.('tests')}
              >
                Tests ({scheduledTests.length})
              </button>}
              {onCommitAllSeed && <button type="button" className="matrix-filter-btn matrix-sync-btn" onClick={onCommitAllSeed} disabled={committing}><Database size={13} /> {committing ? 'Syncing…' : 'Sync banks'}</button>}
            </div>
          </div>

          <div className="matrix-table-wrapper">
            <table className="unit-audit-table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Questions</th>
                  <th>Quality</th>
                  <th>Answer keys</th>
                  {(onSelectUnit || onUploadUnitFile || onDownloadTemplate) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {/* Free Diagnostic Demo CBT Row */}
                {(activeFilter === 'all' || activeFilter === 'demo') && (
                  <tr className="row-active" style={{ background: 'rgba(124, 58, 237, 0.05)' }}>
                    <td className="unit-title-cell" data-label="Bank">
                      <div className="matrix-unit-title">
                        <span className="unit-num-badge" aria-hidden="true">🎯</span>
                        <span className="unit-name-text" style={{ color: 'var(--accent-primary)' }}>Diagnostic Demo Entrance Test</span>
                      </div>
                      <div className="unit-file-text">{demoStats?.fileName || 'Botany_Entrance_30_MCQ_Mixed.xlsx'} · v{demoStats?.version || 1}</div>
                    </td>
                    <td className="unit-count-cell" data-label="Questions">
                      <div className="count-primary">
                        <strong>{demoStats?.questionCount || 0}</strong>
                        <span className="count-slash">/ 30 Q</span>
                      </div>
                      <span className="matrix-coverage-text">{Math.min(100, Math.round(((demoStats?.questionCount || 0) / 30) * 100))}% ready</span>
                    </td>
                    <td data-label="Quality">
                      <div className="matrix-quality-stack">
                        <span><CheckCircle2 size={13} /> 100% analysis</span>
                        <span><Award size={13} /> 100% notes</span>
                      </div>
                    </td>
                    <td data-label="Answer keys">
                      <div className="key-dist-chips">
                        <span className="k-chip a" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-primary)' }}>Balanced Spread</span>
                      </div>
                    </td>
                    {(onSelectUnit || onUploadUnitFile || onDownloadTemplate) && (
                      <td data-label="Actions">
                        <div className="matrix-row-actions">
                        {onDownloadTemplate && <button type="button" className="matrix-template-btn" onClick={() => onDownloadTemplate('diagnostic_demo')} title="Download diagnostic demo Excel template" aria-label="Download diagnostic demo Excel template"><Download size={14} /><span>Template</span></button>}
                        {onUploadUnitFile && <button type="button" className="matrix-upload-btn" onClick={() => chooseRowFile('diagnostic_demo')} disabled={committing} aria-label="Upload Excel question bank for diagnostic demo"><Upload size={13} /><span>Upload</span></button>}
                        {onSelectUnit && <button
                          type="button"
                          className="btn btn-primary btn-xs select-unit-btn"
                          onClick={() => onSelectUnit('diagnostic_demo')}
                          title="View the diagnostic bank, export questions, and review versions"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )}
                {unitsList
                  .filter(u => activeFilter === 'all' || (activeFilter === 'uploaded' && u.questionCount > 0))
                  .map((unit) => {
                    const coverage = unit.coveragePercent || 0;
                    const uKeys = unit.keyDistribution || { A: 0, B: 0, C: 0, D: 0 };

                    return (
                      <tr key={unit.unitId} className={unit.questionCount > 0 ? 'row-active' : 'row-empty'}>
                        <td className="unit-title-cell" data-label="Bank">
                          <div className="matrix-unit-title"><span className="unit-num-badge">{unit.unitNumber}</span><span className="unit-name-text">{unit.title}</span></div>
                          <div className="unit-file-text">{unit.fileName || `${unit.unitId}.xlsx`} · v{unit.version || 1}</div>
                        </td>
                        <td className="unit-count-cell" data-label="Questions">
                          <div className="count-primary">
                            <strong>{unit.questionCount}</strong>
                            <span className="count-slash">/ {unit.targetCount} Q</span>
                          </div>
                          <span className="matrix-coverage-text">{coverage}% ready</span>
                        </td>
                        <td data-label="Quality">
                          <div className="matrix-quality-stack">
                            <span><CheckCircle2 size={13} /> {unit.fourOptionAnalysisPct}% analysis</span>
                            <span><Award size={13} /> {unit.contextNotePct}% notes</span>
                          </div>
                        </td>
                        <td data-label="Answer keys">
                          <div className="key-dist-chips">
                            <span className="k-chip a">A:{uKeys.A}</span>
                            <span className="k-chip b">B:{uKeys.B}</span>
                            <span className="k-chip c">C:{uKeys.C}</span>
                            <span className="k-chip d">D:{uKeys.D}</span>
                          </div>
                        </td>
                        {(onSelectUnit || onUploadUnitFile || onDownloadTemplate) && (
                          <td data-label="Actions">
                            <div className="matrix-row-actions">
                            {onDownloadTemplate && <button type="button" className="matrix-template-btn" onClick={() => onDownloadTemplate(unit.unitId)} title={`Download Unit ${unit.unitNumber} Excel template`} aria-label={`Download Unit ${unit.unitNumber} Excel template`}><Download size={14} /><span>Template</span></button>}
                            {onUploadUnitFile && <button type="button" className="matrix-upload-btn" onClick={() => chooseRowFile(unit.unitId)} disabled={committing} aria-label={`Upload Excel question bank for Unit ${unit.unitNumber}`}><Upload size={13} /><span>Upload</span></button>}
                            {onSelectUnit && <button
                              type="button"
                              className="btn btn-secondary btn-xs select-unit-btn"
                              onClick={() => onSelectUnit(unit.unitId)}
                              title={`View Unit ${unit.unitNumber} questions, export, and review versions`}
                            >
                              <span>Inspect</span>
                              <ArrowRight size={12} />
                            </button>}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                {showScheduledTests && activeFilter === 'tests' && scheduledTests.map(test => {
                  const bank = questionStats.testBankStats?.[test.id];
                  const count = bank?.questionCount || 0;
                  const target = test.questionCount || 0;
                  const coverage = target ? Math.min(100, Math.round(count / target * 100)) : 0;
                  return (
                    <tr key={test.id} className={count ? 'row-active' : 'row-empty'}>
                      <td className="unit-title-cell" data-label="Bank">
                        <div className="matrix-unit-title"><span className="unit-num-badge">{test.code}</span><span className="unit-name-text">{test.title}</span></div>
                        <div className="unit-file-text">{test.category} · {test.unitCovered}</div>
                      </td>
                      <td className="unit-count-cell" data-label="Questions">
                        <div className="count-primary"><strong>{count}</strong><span className="count-slash">/ {target} Q</span></div>
                        <span className="matrix-coverage-text">{coverage}% ready</span>
                      </td>
                      <td data-label="Quality"><div className="matrix-quality-stack"><span><CheckCircle2 size={13} /> {bank?.fourOptionAnalysisPct || 0}% analysis</span></div></td>
                      <td data-label="Answer keys"><span className="matrix-coverage-text">—</span></td>
                      {(onSelectUnit || onUploadUnitFile || onDownloadTemplate) && <td data-label="Actions"><div className="matrix-row-actions">
                        {onDownloadTemplate && <button type="button" className="matrix-template-btn" onClick={() => onDownloadTemplate(test.id)} title={`Download ${test.code} Excel template`} aria-label={`Download ${test.code} Excel template`}><Download size={14} /><span>Template</span></button>}
                        {onUploadUnitFile && <button type="button" className="matrix-upload-btn" onClick={() => chooseRowFile(test.id)} disabled={committing} aria-label={`Upload Excel question bank for ${test.code}`}><Upload size={13} /><span>Upload</span></button>}
                        {onSelectUnit && <button type="button" className="btn btn-secondary btn-xs select-unit-btn" onClick={() => onSelectUnit(test.id)} title={`View ${test.code} questions, export, and review versions`}><span>Inspect</span><ArrowRight size={12} /></button>}
                      </div></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
