/**
 * RightPanel v3.0 - Social Intelligence Display
 * Papers Please style interaction - click to reveal connections
 */

import React, { useState } from 'react';
import CollapsiblePanel from './CollapsiblePanel';
import './cti-dashboard.css';
import './collapsible-panel.css';
import './papers-please.css';

interface RightPanelProps {
  socialIntel?: {
    totalPosts: number;
    themes: string[];
    tone: 'speculative' | 'confirmed' | 'mixed';
    topPosts: Array<{
      excerpt: string;
      author: string;
      engagement: number;
      url?: string;
    }>;
  };
  keywords?: string[];
  highlightedConcept?: string | null;
  onConceptClick?: (concept: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  socialIntel,
  keywords,
  highlightedConcept,
  onConceptClick
}) => {
  const [inspectedPost, setInspectedPost] = useState<number | null>(null);
  const [stampedItems, setStampedItems] = useState<Set<string>>(new Set());

  const isHighlighted = (concept: string) => highlightedConcept === concept;
  
  // Check if a post contains the highlighted concept
  const postContainsConcept = (post: { excerpt: string; author: string }, concept: string | null): boolean => {
    if (!concept) return false;
    const lowerConcept = concept.toLowerCase();
    return post.excerpt.toLowerCase().includes(lowerConcept) || 
           post.author.toLowerCase().includes(lowerConcept);
  };

  // Handle stamp action (Papers Please style verification)
  const handleStamp = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStampedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toneConfig = {
    confirmed: { color: '#ff4444', icon: '🔴', label: 'CONFIRMED', severity: 'high' },
    mixed: { color: '#ffcc00', icon: '🟡', label: 'MIXED', severity: 'medium' },
    speculative: { color: '#00ff88', icon: '🟢', label: 'SPECULATIVE', severity: 'low' }
  };

  const tone = toneConfig[socialIntel?.tone || 'speculative'];

  return (
    <aside className="cti-right-panel cti-panel-futuristic papers-please-style">
      {/* Panel Header */}
      <div className="cti-panel-header-futuristic">
        <div className="panel-header-content">
          <div className="panel-icon-hex social">
            <span>💬</span>
          </div>
          <div className="panel-header-text">
            <h3>Social Intelligence</h3>
            <span className="panel-subtitle">OSINT Feed Analysis</span>
          </div>
        </div>
        {socialIntel && (
          <div className="panel-stat-badge social">
            <span className="stat-value">{socialIntel.totalPosts}</span>
            <span className="stat-label">Posts</span>
          </div>
        )}
      </div>

      <div className="cti-panel-content">
        {/* Tone Assessment - Papers Please style stamp card */}
        {socialIntel && (
          <div className="pp-assessment-card">
            <div className="pp-card-header">
              <span className="pp-card-title">ASSESSMENT</span>
              <span className="pp-card-serial">#{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="pp-tone-display">
              <div 
                className={`pp-tone-indicator ${socialIntel.tone}`}
                style={{ '--tone-color': tone.color } as React.CSSProperties}
              >
                <span className="tone-icon">{tone.icon}</span>
                <span className="tone-label">{tone.label}</span>
              </div>
              <div className="pp-stats-row">
                <div className="pp-stat">
                  <span className="pp-stat-num">{socialIntel.totalPosts}</span>
                  <span className="pp-stat-label">SIGNALS</span>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat-num">{socialIntel.themes.length}</span>
                  <span className="pp-stat-label">THEMES</span>
                </div>
              </div>
            </div>
            <button 
              className={`pp-stamp-btn ${stampedItems.has('assessment') ? 'stamped' : ''}`}
              onClick={(e) => handleStamp('assessment', e)}
            >
              {stampedItems.has('assessment') ? '✓ VERIFIED' : 'VERIFY'}
            </button>
          </div>
        )}

        {/* Themes - Interactive tags with connection highlighting */}
        {socialIntel?.themes && socialIntel.themes.length > 0 && (
          <CollapsiblePanel
            title="Detected Themes"
            icon="🔥"
            variant="warning"
            badge={socialIntel.themes.length}
            defaultExpanded={true}
            glowEffect={socialIntel.themes.some(t => isHighlighted(t))}
          >
            <div className="pp-themes-grid">
              {socialIntel.themes.map((theme, i) => {
                const isActive = isHighlighted(theme);
                const isStamped = stampedItems.has(`theme-${theme}`);
                return (
                  <div 
                    key={i}
                    className={`pp-theme-card ${isActive ? 'active connected' : ''} ${isStamped ? 'stamped' : ''}`}
                    onClick={() => onConceptClick?.(theme)}
                  >
                    <div className="pp-theme-content">
                      <span className="pp-theme-icon">📌</span>
                      <span className="pp-theme-text">{theme}</span>
                    </div>
                    {isActive && (
                      <div className="pp-connection-indicator">
                        <span className="connection-line"></span>
                        <span className="connection-dot"></span>
                      </div>
                    )}
                    <button 
                      className="pp-mini-stamp"
                      onClick={(e) => handleStamp(`theme-${theme}`, e)}
                    >
                      {isStamped ? '✓' : '○'}
                    </button>
                  </div>
                );
              })}
            </div>
          </CollapsiblePanel>
        )}

        {/* Posts - Papers Please document inspection style */}
        {socialIntel?.topPosts && socialIntel.topPosts.length > 0 && (
          <CollapsiblePanel
            title="Intelligence Feed"
            icon="📄"
            variant="info"
            badge={socialIntel.topPosts.length}
            defaultExpanded={true}
          >
            <div className="pp-documents-stack">
              {socialIntel.topPosts.slice(0, 5).map((post, i) => {
                const isInspected = inspectedPost === i;
                const hasConnection = postContainsConcept(post, highlightedConcept);
                const isStamped = stampedItems.has(`post-${i}`);
                
                return (
                  <div 
                    key={i}
                    className={`pp-document ${isInspected ? 'inspected' : ''} ${hasConnection ? 'has-connection' : ''} ${isStamped ? 'stamped' : ''}`}
                    onClick={() => {
                      setInspectedPost(isInspected ? null : i);
                      onConceptClick?.(post.author);
                    }}
                  >
                    {/* Connection line when related to highlighted concept */}
                    {hasConnection && (
                      <div className="pp-connection-beam">
                        <div className="beam-line"></div>
                        <div className="beam-label">MATCH</div>
                      </div>
                    )}

                    <div className="pp-doc-header">
                      <div className="pp-doc-meta">
                        <span className="pp-doc-source">X.COM</span>
                        <span className="pp-doc-id">@{post.author}</span>
                      </div>
                      <div className="pp-doc-engagement">
                        <span className="engagement-icon">♥</span>
                        <span className="engagement-count">{post.engagement}</span>
                      </div>
                    </div>

                    <div className="pp-doc-body">
                      <p className="pp-doc-text">
                        {isInspected 
                          ? post.excerpt 
                          : post.excerpt.length > 80 
                            ? `${post.excerpt.substring(0, 80)}...` 
                            : post.excerpt
                        }
                      </p>
                      
                      {/* Highlight matching keywords in expanded view */}
                      {isInspected && highlightedConcept && (
                        <div className="pp-doc-analysis">
                          <span className="analysis-label">KEYWORD DETECTED:</span>
                          <span className="analysis-match">{highlightedConcept}</span>
                        </div>
                      )}
                    </div>

                    <div className="pp-doc-footer">
                      {post.url && (
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="pp-doc-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          VIEW SOURCE ↗
                        </a>
                      )}
                      <button 
                        className={`pp-stamp-action ${isStamped ? 'active' : ''}`}
                        onClick={(e) => handleStamp(`post-${i}`, e)}
                      >
                        <span className="stamp-icon">{isStamped ? '✓' : '◯'}</span>
                        <span className="stamp-text">{isStamped ? 'FLAGGED' : 'FLAG'}</span>
                      </button>
                    </div>

                    {/* Stamp overlay when flagged */}
                    {isStamped && (
                      <div className="pp-stamp-overlay">
                        <span>FLAGGED</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsiblePanel>
        )}

        {/* Keywords - Interactive connection nodes */}
        {keywords && keywords.length > 0 && (
          <CollapsiblePanel
            title="Keywords"
            icon="🔑"
            variant="default"
            defaultExpanded={false}
          >
            <div className="pp-keywords-board">
              {keywords.map((keyword, i) => {
                const isActive = isHighlighted(keyword);
                return (
                  <button
                    key={i}
                    className={`pp-keyword-pin ${isActive ? 'active' : ''}`}
                    onClick={() => onConceptClick?.(keyword)}
                  >
                    <span className="pin-connector"></span>
                    <span className="pin-label">#{keyword}</span>
                    {isActive && <span className="pin-pulse"></span>}
                  </button>
                );
              })}
            </div>
          </CollapsiblePanel>
        )}
      </div>

      {/* Panel Footer */}
      <div className="cti-panel-footer-futuristic">
        <div className="pp-footer-stats">
          <span className="footer-stat">
            <span className="stat-icon">✓</span>
            {stampedItems.size} flagged
          </span>
        </div>
        <div className="footer-source">
          <span className="source-badge">X.COM</span>
          <span className="source-badge">OSINT</span>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;