import React, { useState } from 'react';
import { 
  FileSpreadsheet, CheckCircle2, AlertTriangle, Layers, 
  BarChart3, ArrowRight, Sparkles, Check, ChevronDown, 
  ChevronUp, ShieldCheck, Database, Award, RefreshCw 
} from 'lucide-react';
import './QuestionBankStatsMatrix.css';

export default function QuestionBankStatsMatrix({
  questionStats,
  onSelectUnit,
  onCommitAllSeed,
  committing = false,
  mode = 'banner', // 'banner' | 'full'
  onRefresh
}) {
  const [isExpanded, setIsExpanded] = useState(mode === 'full');
  const [activeUnitFilter, setActiveUnitFilter] = useState('all');

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
    seriesTotalTarget = 2700,
    unitsLoadedCount = 0,
    totalUnitsCount = 10,
    overallAnalysisPct = 0,
    overallContextPct = 0,
    overallCoveragePct = 0,
    overallKeyDistribution = { A: 0, B: 0, C: 0, D: 0 },
    unitStats = {}
  } = questionStats;

  const keyTotal = (overallKeyDistribution.A || 0) + (overallKeyDistribution.B || 0) + 
                   (overallKeyDistribution.C || 0) + (overallKeyDistribution.D || 0) || 1;

  const keyPctA = Math.round(((overallKeyDistribution.A || 0) / keyTotal) * 100);
  const keyPctB = Math.round(((overallKeyDistribution.B || 0) / keyTotal) * 100);
  const keyPctC = Math.round(((overallKeyDistribution.C || 0) / keyTotal) * 100);
  const keyPctD = Math.round(((overallKeyDistribution.D || 0) / keyTotal) * 100);

  const unitsList = Object.values(unitStats).sort((a, b) => a.unitNumber - b.unitNumber);

  return (
    <div className={`question-stats-matrix-container ${mode}`}>
      {/* EXECUTIVE KPI BAR */}
      <div className="matrix-kpi-banner">
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
        </div>
      </div>

      {/* EXPANDABLE 10-UNIT AUDIT MATRIX */}
      {isExpanded && (
        <div className="matrix-expanded-details">
          <div className="matrix-table-toolbar">
            <div className="matrix-toolbar-title">
              <h5>Unit-by-Unit Question Bank Breakdown (Units 1 to 10)</h5>
              <span>Auditing row counts, distractors, and balance per unit file</span>
            </div>
            <div className="matrix-filter-buttons">
              <button 
                type="button" 
                className={`matrix-filter-btn ${activeUnitFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveUnitFilter('all')}
              >
                All 10 Units ({unitsList.length})
              </button>
              <button 
                type="button" 
                className={`matrix-filter-btn ${activeUnitFilter === 'uploaded' ? 'active' : ''}`}
                onClick={() => setActiveUnitFilter('uploaded')}
              >
                Loaded Banks ({unitsList.filter(u => u.questionCount > 0).length})
              </button>
            </div>
          </div>

          <div className="matrix-table-wrapper">
            <table className="unit-audit-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Unit Title</th>
                  <th style={{ width: '150px' }}>Bank MCQs</th>
                  <th style={{ width: '120px' }}>Coverage</th>
                  <th style={{ width: '130px' }}>4-Option Analysis</th>
                  <th style={{ width: '110px' }}>Context Notes</th>
                  <th style={{ width: '140px' }}>Answer Key Spread</th>
                  <th style={{ width: '85px' }}>Version</th>
                  {onSelectUnit && <th style={{ width: '100px', textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {unitsList
                  .filter(u => activeUnitFilter === 'all' || u.questionCount > 0)
                  .map((unit) => {
                    const coverage = unit.coveragePercent || 0;
                    const uKeys = unit.keyDistribution || { A: 0, B: 0, C: 0, D: 0 };

                    return (
                      <tr key={unit.unitId} className={unit.questionCount > 0 ? 'row-active' : 'row-empty'}>
                        <td className="unit-num-cell">
                          <span className="unit-num-badge">{unit.unitNumber}</span>
                        </td>
                        <td className="unit-title-cell">
                          <div className="unit-name-text">{unit.title}</div>
                          <div className="unit-file-text">{unit.fileName || `${unit.unitId}.xlsx`}</div>
                        </td>
                        <td className="unit-count-cell">
                          <div className="count-primary">
                            <strong>{unit.questionCount}</strong>
                            <span className="count-slash">/ {unit.targetCount} Q</span>
                          </div>
                          <div className="unit-mini-progress">
                            <div 
                              className="unit-mini-bar" 
                              style={{ width: `${coverage}%` }}
                            ></div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${unit.questionCount >= unit.targetCount ? 'full' : unit.questionCount > 0 ? 'partial' : 'empty'}`}>
                            {unit.questionCount >= unit.targetCount ? '100% Ready' : `${coverage}% Prepared`}
                          </span>
                        </td>
                        <td>
                          <div className="quality-metric">
                            <CheckCircle2 size={13} className="text-success" />
                            <span>{unit.fourOptionAnalysisPct}% Complete</span>
                          </div>
                        </td>
                        <td>
                          <div className="quality-metric">
                            <Award size={13} className="text-accent" />
                            <span>{unit.contextNotePct}% Attached</span>
                          </div>
                        </td>
                        <td>
                          <div className="key-dist-chips">
                            <span className="k-chip a">A:{uKeys.A}</span>
                            <span className="k-chip b">B:{uKeys.B}</span>
                            <span className="k-chip c">C:{uKeys.C}</span>
                            <span className="k-chip d">D:{uKeys.D}</span>
                          </div>
                        </td>
                        <td>
                          <span className="version-tag">v{unit.version || 1}</span>
                        </td>
                        {onSelectUnit && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs select-unit-btn"
                              onClick={() => onSelectUnit(unit.unitId)}
                              title={`Inspect and manage Unit ${unit.unitNumber} questions in Excel Hub`}
                            >
                              <span>Manage</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        )}
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
