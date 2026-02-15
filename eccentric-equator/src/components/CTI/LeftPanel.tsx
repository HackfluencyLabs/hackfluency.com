/**
 * LeftPanel v3.0 - Technical IoCs Display
 * Futuristic design with collapsible sections
 * Shows CVEs, IPs, Domains, Keywords, Infrastructure data
 */

import React, { useState } from 'react';
import CollapsiblePanel from './CollapsiblePanel';
import './cti-dashboard.css';
import './collapsible-panel.css';

interface LeftPanelProps {
  indicators: {
    cves: string[];
    domains: string[];
    ips: string[];
    keywords: string[];
  };
  infrastructure?: {
    totalHosts: number;
    exposedPorts: Array<{ port: number; service: string; count: number; percentage: number }>;
    topCountries: Array<{ country: string; count: number }>;
    vulnerableHosts: number;
  };
  iocStats?: {
    uniqueCVECount: number;
    uniqueDomainCount: number;
    uniqueIPCount: number;
    totalIndicators: number;
  };
  highlightedConcept?: string | null;
  onConceptClick?: (concept: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  indicators,
  infrastructure,
  iocStats,
  highlightedConcept,
  onConceptClick
}) => {
  const [expandedDomains, setExpandedDomains] = useState(false);
  const isHighlighted = (concept: string) => highlightedConcept === concept;
  const highlightedCVE = indicators.cves.some(cve => highlightedConcept === cve);

  return (
    <aside className="cti-left-panel cti-panel-futuristic">
      {/* Panel Header */}
      <div className="cti-panel-header-futuristic">
        <div className="panel-header-content">
          <div className="panel-icon-hex">
            <span>🔬</span>
          </div>
          <div className="panel-header-text">
            <h3>Technical Intelligence</h3>
            <span className="panel-subtitle">IoCs & Infrastructure</span>
          </div>
        </div>
        {iocStats && (
          <div className="panel-stat-badge">
            <span className="stat-value">{iocStats.totalIndicators}</span>
            <span className="stat-label">IoCs</span>
          </div>
        )}
      </div>

      <div className="cti-panel-content">
        {/* IoC Statistics Summary */}
        {iocStats && (
          <div className="cti-ioc-stats-grid">
            <div className={`ioc-stat-item ${highlightedCVE ? 'highlighted' : ''}`}>
              <div className="stat-icon">🐛</div>
              <div className="stat-info">
                <span className="stat-number">{iocStats.uniqueCVECount}</span>
                <span className="stat-name">CVEs</span>
              </div>
            </div>
            <div className={`ioc-stat-item ${isHighlighted('domain') ? 'highlighted' : ''}`}>
              <div className="stat-icon">🌐</div>
              <div className="stat-info">
                <span className="stat-number">{iocStats.uniqueDomainCount}</span>
                <span className="stat-name">Domains</span>
              </div>
            </div>
            <div className={`ioc-stat-item ${isHighlighted('IP') ? 'highlighted' : ''}`}>
              <div className="stat-icon">📡</div>
              <div className="stat-info">
                <span className="stat-number">{iocStats.uniqueIPCount}</span>
                <span className="stat-name">IPs</span>
              </div>
            </div>
          </div>
        )}

        {/* CVEs Section */}
        {indicators.cves.length > 0 && (
          <CollapsiblePanel
            title="Vulnerabilities"
            icon="🐛"
            variant="critical"
            badge={indicators.cves.length}
            badgeVariant={highlightedCVE ? 'pulse' : 'default'}
            defaultExpanded={true}
            glowEffect={highlightedCVE}
          >
            <div className="cti-cve-list">
              {indicators.cves.map((cve, i) => (
                <a
                  key={i}
                  href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`cti-cve-chip ${highlightedConcept === cve ? 'highlighted' : ''}`}
                  onClick={(e) => {
                    if (onConceptClick) {
                      e.preventDefault();
                      onConceptClick(cve);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://nvd.nist.gov/vuln/detail/${cve}`, '_blank');
                  }}
                >
                  <span className="cve-severity-dot" />
                  <span className="cve-id">{cve}</span>
                  <span className="cve-link-icon">↗</span>
                </a>
              ))}
            </div>
          </CollapsiblePanel>
        )}

        {/* Domains Section */}
        {indicators.domains.length > 0 && (
          <CollapsiblePanel
            title="Domains"
            icon="🌐"
            variant="info"
            badge={indicators.domains.length}
            defaultExpanded={true}
          >
            <div className="cti-domains-grid">
              {(expandedDomains ? indicators.domains : indicators.domains.slice(0, 6)).map((domain, i) => (
                <button
                  key={i}
                  className={`cti-domain-chip ${highlightedConcept === domain ? 'highlighted' : ''}`}
                  onClick={() => onConceptClick?.(domain)}
                >
                  <span className="domain-dot" />
                  <span className="domain-name">{domain.length > 20 ? domain.substring(0, 20) + '…' : domain}</span>
                </button>
              ))}
            </div>
            {indicators.domains.length > 6 && (
              <button 
                className="cti-expand-btn"
                onClick={() => setExpandedDomains(!expandedDomains)}
              >
                {expandedDomains ? '▲ Show less' : `▼ Show ${indicators.domains.length - 6} more`}
              </button>
            )}
          </CollapsiblePanel>
        )}

        {/* IPs Section */}
        {indicators.ips.length > 0 && (
          <CollapsiblePanel
            title="IP Addresses"
            icon="📡"
            variant="warning"
            badge={indicators.ips.length}
            defaultExpanded={true}
          >
            <div className="cti-ip-grid">
              {indicators.ips.map((ip, i) => (
                <button
                  key={i}
                  className={`cti-ip-chip ${highlightedConcept === ip ? 'highlighted' : ''}`}
                  onClick={() => onConceptClick?.(ip)}
                >
                  <code>{ip}</code>
                </button>
              ))}
            </div>
          </CollapsiblePanel>
        )}

        {/* Keywords */}
        {indicators.keywords.length > 0 && (
          <CollapsiblePanel
            title="Keywords"
            icon="🔑"
            variant="default"
            defaultExpanded={false}
          >
            <div className="cti-keywords-wrap">
              {indicators.keywords.map((keyword, i) => (
                <button
                  key={i}
                  className={`cti-keyword-tag ${highlightedConcept === keyword ? 'highlighted' : ''}`}
                  onClick={() => onConceptClick?.(keyword)}
                >
                  #{keyword}
                </button>
              ))}
            </div>
          </CollapsiblePanel>
        )}

        {/* Infrastructure */}
        <CollapsiblePanel
          title="Infrastructure"
          icon="🖥️"
          variant={infrastructure?.vulnerableHosts ? 'critical' : 'success'}
          badge={infrastructure?.totalHosts || 0}
          defaultExpanded={true}
        >
          <div className="cti-infra-overview">
            <div className="infra-stat-row">
              <div className="infra-stat">
                <span className="infra-stat-value">{infrastructure?.totalHosts || 0}</span>
                <span className="infra-stat-label">Exposed Hosts</span>
              </div>
              <div className="infra-stat">
                <span className={`infra-stat-value ${infrastructure?.vulnerableHosts ? 'danger' : 'safe'}`}>
                  {infrastructure?.vulnerableHosts || 0}
                </span>
                <span className="infra-stat-label">Vulnerable</span>
              </div>
            </div>

            {infrastructure?.exposedPorts && infrastructure.exposedPorts.length > 0 && (
              <div className="infra-ports">
                <span className="ports-title">Top Services</span>
                {infrastructure.exposedPorts.slice(0, 4).map((port, i) => (
                  <div key={i} className="port-row">
                    <span className="port-number">{port.port}</span>
                    <span className="port-service">{port.service}</span>
                    <div className="port-bar-track">
                      <div 
                        className="port-bar-fill"
                        style={{ width: `${port.percentage}%` }}
                      />
                    </div>
                    <span className="port-count">{port.count}</span>
                  </div>
                ))}
              </div>
            )}

            {(!infrastructure?.totalHosts || infrastructure.totalHosts === 0) && (
              <div className="infra-clean-state">
                <span className="clean-check">✓</span>
                <span className="clean-text">No exposed infrastructure detected</span>
              </div>
            )}
          </div>
        </CollapsiblePanel>
      </div>

      {/* Panel Footer */}
      <div className="cti-panel-footer-futuristic">
        <span className="source-label">Sources:</span>
        <span className="source-badge">Shodan</span>
        <span className="source-badge">NVD</span>
      </div>
    </aside>
  );
};

export default LeftPanel;