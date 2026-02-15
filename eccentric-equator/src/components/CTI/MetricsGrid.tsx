/**
 * MetricsGrid v3.0 - Signal Distribution Display
 * Futuristic holographic meters with animated bars
 */

import React, { useState, useEffect } from 'react';
import './cti-dashboard.css';

interface MetricsGridProps {
  metrics: {
    totalSignals: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    categories: Array<{ name: string; count: number; percentage: number }>;
  };
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const [animatedValues, setAnimatedValues] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Animate numbers on mount
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      setAnimatedValues({
        critical: Math.round(metrics.criticalCount * eased),
        high: Math.round(metrics.highCount * eased),
        medium: Math.round(metrics.mediumCount * eased),
        low: Math.round(metrics.lowCount * eased),
        total: Math.round(metrics.totalSignals * eased)
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [metrics]);

  const SEVERITY_CONFIG = [
    { key: 'critical', label: 'CRITICAL', color: '#ff3366', icon: '🔴', glow: 'rgba(255,51,102,0.5)' },
    { key: 'high', label: 'HIGH', color: '#ff9933', icon: '🟠', glow: 'rgba(255,153,51,0.4)' },
    { key: 'medium', label: 'MEDIUM', color: '#ffcc00', icon: '🟡', glow: 'rgba(255,204,0,0.3)' },
    { key: 'low', label: 'LOW', color: '#00ff88', icon: '🟢', glow: 'rgba(0,255,136,0.3)' }
  ] as const;

  const getCount = (key: string): number => {
    switch (key) {
      case 'critical': return animatedValues.critical;
      case 'high': return animatedValues.high;
      case 'medium': return animatedValues.medium;
      case 'low': return animatedValues.low;
      default: return 0;
    }
  };

  const getActualCount = (key: string): number => {
    switch (key) {
      case 'critical': return metrics.criticalCount;
      case 'high': return metrics.highCount;
      case 'medium': return metrics.mediumCount;
      case 'low': return metrics.lowCount;
      default: return 0;
    }
  };

  return (
    <div className="metrics-grid-futuristic">
      {/* Header with total signals */}
      <div className="metrics-header-futuristic">
        <div className="metrics-total-display">
          <div className="total-ring">
            <svg viewBox="0 0 100 100" className="total-ring-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="4"/>
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="url(#totalGradient)" 
                strokeWidth="4"
                strokeDasharray={`${(animatedValues.total / (metrics.totalSignals || 1)) * 283} 283`}
                transform="rotate(-90 50 50)"
                className="total-ring-progress"
              />
              <defs>
                <linearGradient id="totalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ff88"/>
                  <stop offset="50%" stopColor="#00d4ff"/>
                  <stop offset="100%" stopColor="#cc66ff"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="total-value">
              <span className="total-number">{animatedValues.total}</span>
              <span className="total-label">SIGNALS</span>
            </div>
          </div>
        </div>
        <div className="metrics-title-section">
          <span className="metrics-label">SIGNAL DISTRIBUTION</span>
          <span className="metrics-sublabel">Threat Classification Matrix</span>
        </div>
      </div>

      {/* Severity meters */}
      <div className="severity-meters">
        {SEVERITY_CONFIG.map((sev) => {
          const count = getCount(sev.key);
          const actualCount = getActualCount(sev.key);
          const percentage = metrics.totalSignals > 0 
            ? Math.round((actualCount / metrics.totalSignals) * 100) 
            : 0;
          const isSelected = selectedSeverity === sev.key;

          return (
            <div 
              key={sev.key} 
              className={`severity-meter ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedSeverity(isSelected ? null : sev.key)}
              style={{
                '--severity-color': sev.color,
                '--severity-glow': sev.glow,
              } as React.CSSProperties}
            >
              <div className="meter-header">
                <span className="meter-icon">{sev.icon}</span>
                <span className="meter-label">{sev.label}</span>
                <span className="meter-percentage">{percentage}%</span>
              </div>
              <div className="meter-bar-container">
                <div className="meter-bar-bg">
                  <div 
                    className="meter-bar-fill"
                    style={{ 
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${sev.color}88, ${sev.color})`,
                      boxShadow: `0 0 20px ${sev.glow}`
                    }}
                  />
                  <div className="meter-bar-glow" style={{ 
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, transparent, ${sev.color}40)`
                  }}/>
                </div>
                <div className="meter-scanline"/>
              </div>
              <div className="meter-value">
                <span className="meter-count" style={{ color: sev.color }}>{count}</span>
                <span className="meter-count-label">signals</span>
              </div>
              {isSelected && (
                <div className="meter-detail-panel">
                  <div className="detail-arrow"/>
                  <span className="detail-text">
                    {actualCount} {sev.label.toLowerCase()} severity signals detected
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Categories */}
      {metrics.categories && metrics.categories.length > 0 && (
        <div className="categories-section">
          <div className="categories-header">
            <span className="categories-label">SIGNAL CATEGORIES</span>
            <div className="categories-divider"/>
          </div>
          <div className="category-chips-futuristic">
            {metrics.categories.map((cat, i) => (
              <div 
                key={i} 
                className="category-chip-futuristic"
              >
                <div className="chip-indicator" style={{
                  background: cat.name.toLowerCase().includes('threat') ? '#00ff88' :
                              cat.name.toLowerCase().includes('vuln') ? '#ff9933' :
                              cat.name.toLowerCase().includes('incident') ? '#ff3366' : '#00d4ff'
                }}/>
                <span className="chip-name">{cat.name}</span>
                <span className="chip-count">{cat.count}</span>
                <div className="chip-bar">
                  <div 
                    className="chip-bar-fill" 
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="metrics-footer">
        <span className="footer-timestamp">
          <span className="timestamp-icon">⏱</span>
          Last scan: {new Date().toLocaleTimeString()}
        </span>
        <span className="footer-status">
          <span className="status-dot"/>
          MONITORING ACTIVE
        </span>
      </div>
    </div>
  );
};

export default MetricsGrid;
