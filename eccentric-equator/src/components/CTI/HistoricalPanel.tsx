/**
 * HistoricalPanel v3.0 - Timeline & Intelligence Sources
 * Futuristic timeline with Papers Please document inspection
 */

import React, { useState } from 'react';
import './cti-dashboard.css';

interface HistoricalPanelProps {
  timeline: Array<{
    id: string;
    title: string;
    severity: string;
    category: string;
    timestamp: string;
  }>;
  sources: Array<{
    name: string;
    signalCount: number;
    lastUpdate: string;
  }>;
  baselineComparison?: {
    previousRiskScore: number;
    currentRiskScore: number;
    delta: number;
    trendDirection: string;
  };
}

const HistoricalPanel: React.FC<HistoricalPanelProps> = ({
  timeline,
  sources,
  baselineComparison
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const SEVERITY_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
    critical: { color: '#ff3366', glow: 'rgba(255,51,102,0.5)', label: 'CRITICAL' },
    high: { color: '#ff9933', glow: 'rgba(255,153,51,0.4)', label: 'HIGH' },
    medium: { color: '#ffcc00', glow: 'rgba(255,204,0,0.3)', label: 'MEDIUM' },
    low: { color: '#00ff88', glow: 'rgba(0,255,136,0.3)', label: 'LOW' },
    info: { color: '#00d4ff', glow: 'rgba(0,212,255,0.3)', label: 'INFO' }
  };

  // Check if source might be related to event (simplified connection logic)
  const isSourceRelated = (sourceName: string, eventCategory: string): boolean => {
    const normalized = sourceName.toLowerCase();
    const cat = eventCategory.toLowerCase();
    return (normalized.includes('x') && cat.includes('social')) ||
           (normalized.includes('shodan') && cat.includes('vuln')) ||
           (normalized.includes('nvd') && cat.includes('cve'));
  };

  return (
    <div className={`historical-panel-futuristic ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="historical-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="header-left">
          <div className="header-icon-container">
            <span className="header-icon">📜</span>
            <div className="header-icon-ring"/>
          </div>
          <div className="header-text">
            <span className="header-title">HISTORICAL INTELLIGENCE</span>
            <span className="header-subtitle">
              {timeline.length} events • {sources.length} sources
            </span>
          </div>
        </div>
        <div className="header-right">
          {baselineComparison && (
            <div className={`baseline-badge ${baselineComparison.delta < 0 ? 'improved' : 'degraded'}`}>
              <span className="baseline-delta">
                {baselineComparison.delta > 0 ? '↑' : '↓'} {Math.abs(baselineComparison.delta)}
              </span>
              <span className="baseline-label">vs baseline</span>
            </div>
          )}
          <button className="toggle-btn">
            <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
            <span className="toggle-text">{isCollapsed ? 'EXPAND' : 'COLLAPSE'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="historical-content">
          {/* Baseline Comparison Card */}
          {baselineComparison && (
            <div className="baseline-card">
              <div className="baseline-header">
                <span className="baseline-title">RISK TRAJECTORY</span>
                <div className="baseline-trend">
                  <span className={`trend-arrow ${baselineComparison.trendDirection}`}>
                    {baselineComparison.trendDirection === 'up' ? '📈' : 
                     baselineComparison.trendDirection === 'down' ? '📉' : '➡️'}
                  </span>
                </div>
              </div>
              <div className="baseline-meters">
                <div className="baseline-meter previous">
                  <div className="meter-label">PREVIOUS</div>
                  <div className="meter-value">{baselineComparison.previousRiskScore}</div>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill"
                      style={{ width: `${baselineComparison.previousRiskScore}%` }}
                    />
                  </div>
                </div>
                <div className="baseline-connector">
                  <div className="connector-line"/>
                  <div className={`connector-delta ${baselineComparison.delta < 0 ? 'positive' : 'negative'}`}>
                    {baselineComparison.delta > 0 ? '+' : ''}{baselineComparison.delta}
                  </div>
                  <div className="connector-arrow">→</div>
                </div>
                <div className="baseline-meter current">
                  <div className="meter-label">CURRENT</div>
                  <div className="meter-value">{baselineComparison.currentRiskScore}</div>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill"
                      style={{ 
                        width: `${baselineComparison.currentRiskScore}%`,
                        background: baselineComparison.currentRiskScore > 70 ? '#ff3366' :
                                   baselineComparison.currentRiskScore > 40 ? '#ffcc00' : '#00ff88'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="historical-columns">
            {/* Timeline Events */}
            <div className="timeline-section">
              <div className="section-header">
                <span className="section-icon">⏱️</span>
                <span className="section-title">EVENT TIMELINE</span>
                <span className="section-count">{timeline.length}</span>
              </div>
              <div className="timeline-track">
                {timeline.length > 0 ? timeline.map((event, index) => {
                  const config = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
                  const isSelected = selectedEvent === event.id;
                  const hasConnection = selectedSource && isSourceRelated(selectedSource, event.category);

                  return (
                    <div 
                      key={event.id}
                      className={`timeline-event ${isSelected ? 'selected' : ''} ${hasConnection ? 'connected' : ''}`}
                      onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                      style={{
                        '--event-color': config.color,
                        '--event-glow': config.glow
                      } as React.CSSProperties}
                    >
                      {/* Connection beam */}
                      {hasConnection && (
                        <div className="event-connection-beam">
                          <span className="beam-pulse"/>
                        </div>
                      )}

                      {/* Timeline line */}
                      <div className="event-timeline-marker">
                        <div className="marker-line" style={{ 
                          height: index === timeline.length - 1 ? '50%' : '100%' 
                        }}/>
                        <div className="marker-dot" style={{ background: config.color }}/>
                      </div>

                      {/* Event card */}
                      <div className="event-card">
                        <div className="event-header">
                          <span 
                            className="event-severity-badge"
                            style={{ 
                              background: `${config.color}22`,
                              borderColor: config.color,
                              color: config.color
                            }}
                          >
                            {config.label}
                          </span>
                          <span className="event-category">{event.category}</span>
                        </div>
                        <div className="event-title">{event.title}</div>
                        <div className="event-timestamp">
                          <span className="timestamp-icon">🕐</span>
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Expanded details */}
                        {isSelected && (
                          <div className="event-details">
                            <div className="detail-row">
                              <span className="detail-label">Event ID</span>
                              <span className="detail-value">{event.id}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Correlation</span>
                              <span className="detail-value">
                                {sources.filter(s => isSourceRelated(s.name, event.category)).length} sources
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty-timeline">
                    <span className="empty-icon">📭</span>
                    <span className="empty-text">No events recorded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Intelligence Sources */}
            <div className="sources-section">
              <div className="section-header">
                <span className="section-icon">📡</span>
                <span className="section-title">INTEL SOURCES</span>
                <span className="section-count">{sources.length}</span>
              </div>
              <div className="sources-grid">
                {sources.length > 0 ? sources.map((source, i) => {
                  const isSelected = selectedSource === source.name;
                  const relatedEventsCount = timeline.filter(e => 
                    isSourceRelated(source.name, e.category)
                  ).length;
                  const hasConnection = selectedEvent && timeline.some(e => 
                    e.id === selectedEvent && isSourceRelated(source.name, e.category)
                  );

                  return (
                    <div 
                      key={i}
                      className={`source-card ${isSelected ? 'selected' : ''} ${hasConnection ? 'connected' : ''}`}
                      onClick={() => setSelectedSource(isSelected ? null : source.name)}
                    >
                      {hasConnection && (
                        <div className="source-connection-indicator">
                          <span className="connection-pulse"/>
                        </div>
                      )}
                      <div className="source-status">
                        <div className="status-indicator active"/>
                        <span className="status-label">ACTIVE</span>
                      </div>
                      <div className="source-name">{source.name}</div>
                      <div className="source-stats">
                        <div className="stat">
                          <span className="stat-value">{source.signalCount}</span>
                          <span className="stat-label">signals</span>
                        </div>
                        {relatedEventsCount > 0 && (
                          <div className="stat related">
                            <span className="stat-value">{relatedEventsCount}</span>
                            <span className="stat-label">events</span>
                          </div>
                        )}
                      </div>
                      <div className="source-last-update">
                        <span className="update-icon">🔄</span>
                        {new Date(source.lastUpdate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty-sources">
                    <span className="empty-icon">📭</span>
                    <span className="empty-text">No sources configured</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="historical-footer">
            <span className="footer-hint">
              💡 Click events or sources to see connections
            </span>
            <span className="footer-timestamp">
              Data as of {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPanel;
