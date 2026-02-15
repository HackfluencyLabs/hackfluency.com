/**
 * CollapsiblePanel - Futuristic collapsible container
 * Used across the CTI Dashboard for consistent panel behavior
 */

import React, { useState, useRef, useEffect } from 'react';
import './collapsible-panel.css';

type PanelVariant = 'default' | 'critical' | 'warning' | 'success' | 'info' | 'purple';

interface CollapsiblePanelProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: PanelVariant;
  badge?: string | number;
  badgeVariant?: 'default' | 'pulse' | 'glow';
  actions?: React.ReactNode;
  className?: string;
  onToggle?: (isExpanded: boolean) => void;
  glowEffect?: boolean;
  scanlineEffect?: boolean;
}

const VARIANT_COLORS: Record<PanelVariant, { primary: string; glow: string; bg: string }> = {
  default: { primary: '#00ff88', glow: 'rgba(0, 255, 136, 0.3)', bg: 'rgba(0, 255, 136, 0.03)' },
  critical: { primary: '#ff4444', glow: 'rgba(255, 68, 68, 0.3)', bg: 'rgba(255, 68, 68, 0.03)' },
  warning: { primary: '#ffcc00', glow: 'rgba(255, 204, 0, 0.3)', bg: 'rgba(255, 204, 0, 0.03)' },
  success: { primary: '#00D26A', glow: 'rgba(0, 210, 106, 0.3)', bg: 'rgba(0, 210, 106, 0.03)' },
  info: { primary: '#00d4ff', glow: 'rgba(0, 212, 255, 0.3)', bg: 'rgba(0, 212, 255, 0.03)' },
  purple: { primary: '#cc66ff', glow: 'rgba(204, 102, 255, 0.3)', bg: 'rgba(204, 102, 255, 0.03)' }
};

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  variant = 'default',
  badge,
  badgeVariant = 'default',
  actions,
  className = '',
  onToggle,
  glowEffect = false,
  scanlineEffect = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);
  const colors = VARIANT_COLORS[variant];

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const handleToggle = () => {
    setIsExpanded(prev => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  };

  return (
    <div 
      className={`collapsible-panel ${isExpanded ? 'expanded' : 'collapsed'} variant-${variant} ${className} ${glowEffect ? 'with-glow' : ''} ${scanlineEffect ? 'with-scanline' : ''}`}
      style={{
        '--panel-primary': colors.primary,
        '--panel-glow': colors.glow,
        '--panel-bg': colors.bg
      } as React.CSSProperties}
    >
      {/* Top accent line */}
      <div className="panel-accent-line" />
      
      {/* Header */}
      <div className="panel-header" onClick={handleToggle}>
        <div className="panel-header-left">
          {icon && <span className="panel-icon">{icon}</span>}
          <span className="panel-title">{title}</span>
          {badge !== undefined && (
            <span className={`panel-badge ${badgeVariant}`}>
              {badge}
            </span>
          )}
        </div>
        
        <div className="panel-header-right">
          {actions && (
            <div className="panel-actions" onClick={e => e.stopPropagation()}>
              {actions}
            </div>
          )}
          <button className="panel-toggle-btn">
            <svg 
              className="panel-toggle-icon"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Content with smooth height transition */}
      <div 
        className="panel-content-wrapper"
        style={{ 
          maxHeight: isExpanded ? contentHeight : 0,
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div className="panel-content" ref={contentRef}>
          {children}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="panel-corner panel-corner-tl" />
      <div className="panel-corner panel-corner-tr" />
      <div className="panel-corner panel-corner-bl" />
      <div className="panel-corner panel-corner-br" />
    </div>
  );
};

export default CollapsiblePanel;
