/**
 * CTI Dashboard v3.0 - Futuristic Security Intelligence Visualization
 * Interactive Threat Graph with Collapsible Panels
 */

import React, { useEffect, useState, useCallback } from 'react';
import './cti-dashboard.css';

// Import modular components
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import MITREOverlay from './MITREOverlay';
import RecommendationsPanel from './RecommendationsPanel';
import HistoricalPanel from './HistoricalPanel';
import MetricsGrid from './MetricsGrid';
import ThreatGraph from './ThreatGraph';
import CollapsiblePanel from './CollapsiblePanel';
import './threat-graph.css';
import './collapsible-panel.css';

// Types
interface DashboardData {
  meta: { version: string; generatedAt: string; validUntil: string };
  status: { riskLevel: string; riskScore: number; trend: string; confidenceLevel: number };
  executive: { headline: string; summary: string; keyFindings: string[]; recommendedActions: string[] };
  metrics: { totalSignals: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; categories: Array<{ name: string; count: number; percentage: number }> };
  timeline: Array<{ id: string; title: string; severity: string; category: string; timestamp: string; sourceUrl?: string }>;
  sources: Array<{ name: string; signalCount: number; lastUpdate: string }>;
  indicators: { cves: string[]; domains: string[]; ips: string[]; keywords: string[] };
  infrastructure?: { totalHosts: number; exposedPorts: Array<{ port: number; service: string; count: number; percentage: number }>; topCountries: Array<{ country: string; count: number }>; vulnerableHosts: number };
  socialIntel?: { totalPosts: number; themes: string[]; tone: string; topPosts: Array<{ excerpt: string; author: string; engagement: number; url?: string }> };
  ctiAnalysis?: { model: string; killChainPhase: string; threatLandscape: string; analystBrief?: string; methodologies?: string[]; ttps?: Array<{ technique: string; techniqueId: string; tactic: string; evidence: string; confidence: number }>; mitreAttack?: Array<{ tactic: string; techniques: string[]; mitigations: string[] }> };
  assessmentLayer?: { correlation: { score: number; strength: string; explanation: string }; narrative: string; iocStats: { uniqueCVECount: number; uniqueDomainCount: number; uniqueIPCount: number; totalIndicators: number }; baselineComparison?: { previousRiskScore: number; currentRiskScore: number; delta: number; trendDirection: string } };
  modelMetadata?: { strategic: string; technical: string };
}

const RISK_COLORS: Record<string, string> = {
  critical: '#E31B23',
  elevated: '#FF6B35',
  moderate: '#FFB800',
  low: '#00D26A'
};

const CTIDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Overlay states
  const [mitreOpen, setMitreOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  
  // Interactive concept mapping
  const [highlightedConcept, setHighlightedConcept] = useState<string | null>(null);
  
  // View mode
  const [viewMode, setViewMode] = useState<'graph' | 'grid'>('graph');

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/data/cti-dashboard.json?_cb=${Date.now()}`);
      if (!response.ok) throw new Error('Dashboard data not available');
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError('Intelligence data currently unavailable');
      console.error('Failed to load CTI dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle concept click for interactive mapping
  const handleConceptClick = useCallback((concept: string) => {
    setHighlightedConcept(prev => prev === concept ? null : concept);
  }, []);

  // Handle graph node click
  const handleGraphNodeClick = useCallback((nodeId: string, nodeType: string) => {
    setHighlightedConcept(prev => prev === nodeId ? null : nodeId);
  }, []);

  // Loading state with futuristic animation
  if (loading) {
    return (
      <div className="cti-loading-screen">
        <div className="cti-loading-container">
          <div className="cti-loading-hex">
            <div className="hex-ring"></div>
            <div className="hex-ring"></div>
            <div className="hex-ring"></div>
          </div>
          <div className="cti-loading-text">
            <span className="loading-glitch" data-text="INITIALIZING">INITIALIZING</span>
            <span className="loading-sub">Threat Intelligence Systems</span>
          </div>
          <div className="cti-loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="cti-container">
        <div className="cti-error-screen">
          <div className="cti-error-icon">
            <span className="error-hex">⬡</span>
            <span className="error-symbol">!</span>
          </div>
          <h3 className="cti-error-title">CONNECTION LOST</h3>
          <p className="cti-error-message">{error || 'Threat data stream unavailable'}</p>
          <button className="cti-retry-btn" onClick={() => window.location.reload()}>
            <span>↻</span> RECONNECT
          </button>
        </div>
      </div>
    );
  }

  // Get risk variant for panels
  const getRiskVariant = (): 'critical' | 'warning' | 'success' | 'info' => {
    switch(data.status.riskLevel) {
      case 'critical': return 'critical';
      case 'elevated': return 'warning';
      case 'moderate': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="cti-container cti-v3">
      {/* Animated background grid */}
      <div className="cti-bg-grid"></div>
      <div className="cti-bg-scanlines"></div>
      
      {/* Main Layout - 3 Column Grid */}
      <div className="cti-layout">
        
        {/* Header - Full Width */}
        <header className="cti-main-header">
          <div className="cti-header-left">
            <div className="cti-logo">
              <div className="cti-logo-hex">
                <span className="logo-symbol">◆</span>
              </div>
              <div className="cti-logo-text-group">
                <span className="cti-logo-text">HACKFLUENCY</span>
                <span className="cti-logo-sub">THREAT INTELLIGENCE</span>
              </div>
            </div>
          </div>

          {/* Risk Status Badge */}
          <div className="cti-status-badge-container">
            <div 
              className={`cti-status-badge status-${data.status.riskLevel}`}
              style={{ '--risk-color': RISK_COLORS[data.status.riskLevel] } as React.CSSProperties}
            >
              <div className="status-ring">
                <svg viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={RISK_COLORS[data.status.riskLevel]} 
                    strokeWidth="8"
                    strokeDasharray={`${data.status.riskScore * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="status-score">{data.status.riskScore}</div>
              </div>
              <div className="status-info">
                <span className="status-level">{data.status.riskLevel.toUpperCase()}</span>
                <span className="status-trend">
                  {data.status.trend === 'increasing' ? '↑' : data.status.trend === 'decreasing' ? '↓' : '→'}
                  {data.status.trend}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="cti-header-actions">
            <div className="cti-view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
                title="Graph View"
              >
                🕸️
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ▦
              </button>
            </div>
            <button 
              className={`cti-action-button ${mitreOpen ? 'active' : ''}`}
              onClick={() => setMitreOpen(true)}
            >
              <span className="btn-icon">🎯</span>
              <span className="btn-text">MITRE ATT&CK</span>
            </button>
            <button 
              className={`cti-action-button accent ${recommendationsOpen ? 'active' : ''}`}
              onClick={() => setRecommendationsOpen(true)}
            >
              <span className="btn-icon">🛡️</span>
              <span className="btn-text">MITIGATIONS</span>
            </button>
          </div>
        </header>

        {/* LEFT PANEL - Technical IoCs */}
        <LeftPanel 
          indicators={data.indicators}
          infrastructure={data.infrastructure}
          iocStats={data.assessmentLayer?.iocStats}
          highlightedConcept={highlightedConcept}
          onConceptClick={handleConceptClick}
        />

        {/* CENTER PANEL - Analysis & Graph */}
        <main className="cti-center-panel">
          {/* Threat Graph - New Interactive Visualization */}
          {viewMode === 'graph' && (
            <ThreatGraph
              indicators={data.indicators}
              socialIntel={data.socialIntel}
              riskScore={data.status.riskScore}
              riskLevel={data.status.riskLevel}
              highlightedConcept={highlightedConcept}
              onNodeClick={handleGraphNodeClick}
            />
          )}

          {/* Metrics Grid - Severity Distribution */}
          <CollapsiblePanel
            title="Signal Distribution"
            icon="📊"
            variant={getRiskVariant()}
            badge={data.metrics.totalSignals}
            defaultExpanded={viewMode === 'grid'}
            glowEffect
          >
            <MetricsGrid metrics={data.metrics} />
          </CollapsiblePanel>

          {/* Executive Summary */}
          <CollapsiblePanel
            title="Executive Brief"
            icon="📋"
            variant="info"
            defaultExpanded={true}
            glowEffect
          >
            <div className="cti-executive-content">
              <h4 className="executive-headline">{data.executive.headline}</h4>
              <p className="executive-summary">
                {data.executive.summary.replace(/\*\*/g, '')}
              </p>
              {data.executive.keyFindings.length > 0 && (
                <div className="executive-findings">
                  <span className="findings-label">Key Findings:</span>
                  <ul>
                    {data.executive.keyFindings.map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsiblePanel>

          {/* Correlation Visualization */}
          {data.assessmentLayer && (
            <CollapsiblePanel
              title="Correlation Analysis"
              icon="🔗"
              variant={data.assessmentLayer.correlation.strength === 'strong' ? 'critical' : 
                      data.assessmentLayer.correlation.strength === 'moderate' ? 'warning' : 'default'}
              badge={`${Math.round(data.assessmentLayer.correlation.score * 100)}%`}
              badgeVariant={data.assessmentLayer.correlation.strength === 'strong' ? 'pulse' : 'default'}
              glowEffect
            >
              <div className="cti-correlation-content">
                <div className="correlation-bar-container">
                  <div className="correlation-labels">
                    <span>Weak</span>
                    <span>Strong</span>
                  </div>
                  <div className="correlation-track">
                    <div 
                      className="correlation-fill"
                      style={{ 
                        width: `${data.assessmentLayer.correlation.score * 100}%`,
                        background: data.assessmentLayer.correlation.strength === 'strong' ? 
                          'linear-gradient(90deg, #ff4444, #ff6666)' :
                          data.assessmentLayer.correlation.strength === 'moderate' ?
                          'linear-gradient(90deg, #ffcc00, #ffdd44)' :
                          'linear-gradient(90deg, #00ff88, #44ffaa)'
                      }}
                    />
                    <div className="correlation-markers">
                      {[0, 25, 50, 75, 100].map(mark => (
                        <div key={mark} className="marker" style={{ left: `${mark}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="correlation-explanation">{data.assessmentLayer.correlation.explanation}</p>
              </div>
            </CollapsiblePanel>
          )}

          {/* Analyst Narrative */}
          {data.assessmentLayer?.narrative && (
            <CollapsiblePanel
              title="Analyst Assessment"
              icon="💡"
              variant="purple"
              glowEffect
            >
              <div className="cti-narrative-content">
                <p>{data.assessmentLayer.narrative}</p>
                {data.ctiAnalysis?.analystBrief && (
                  <div className="analyst-brief">
                    <span className="brief-label">Classification:</span>
                    <code>{data.ctiAnalysis.analystBrief}</code>
                  </div>
                )}
              </div>
            </CollapsiblePanel>
          )}

          {/* Methodologies */}
          {data.ctiAnalysis?.methodologies && data.ctiAnalysis.methodologies.length > 0 && (
            <CollapsiblePanel
              title="Analysis Methods"
              icon="🔬"
              defaultExpanded={false}
            >
              <div className="cti-methods-grid">
                {data.ctiAnalysis.methodologies.map((method, i) => (
                  <div key={i} className="method-chip">
                    <span className="method-dot" />
                    {method}
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          )}
        </main>

        {/* RIGHT PANEL - Social Intel */}
        <RightPanel 
          socialIntel={data.socialIntel ? {
            ...data.socialIntel,
            tone: data.socialIntel.tone as 'speculative' | 'confirmed' | 'mixed'
          } : undefined}
          keywords={data.indicators.keywords}
          highlightedConcept={highlightedConcept}
          onConceptClick={handleConceptClick}
        />

        {/* BOTTOM PANEL - Historical Data */}
        <HistoricalPanel 
          timeline={data.timeline}
          sources={data.sources}
          baselineComparison={data.assessmentLayer?.baselineComparison}
        />

      </div>

      {/* Overlays */}
      <MITREOverlay 
        isOpen={mitreOpen}
        onClose={() => setMitreOpen(false)}
        mitreAttack={data.ctiAnalysis?.mitreAttack}
        ttps={data.ctiAnalysis?.ttps}
      />

      <RecommendationsPanel 
        isOpen={recommendationsOpen}
        onClose={() => setRecommendationsOpen(false)}
        recommendations={{
          immediate: data.executive.recommendedActions.slice(0, 2),
          strategic: data.executive.recommendedActions.slice(2),
          rationale: {}
        }}
      />

      {/* Footer */}
      <footer className="cti-footer">
        <div className="cti-footer-content">
          <div className="footer-status">
            <span className="status-dot active" />
            <span>LIVE FEED ACTIVE</span>
          </div>
          <div className="footer-meta">
            <span>Last sync: {new Date(data.meta.generatedAt).toLocaleString('en-US', { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}</span>
            <span className="separator">|</span>
            <span>Valid until: {new Date(data.meta.validUntil).toLocaleTimeString('en-US', { 
              hour: '2-digit', minute: '2-digit' 
            })}</span>
          </div>
          <div className="footer-brand">
            <span className="brand-text">Powered by</span>
            <span className="brand-name">HACKFLUENCY INTELLIGENCE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CTIDashboard;