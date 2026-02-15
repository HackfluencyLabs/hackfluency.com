/**
 * ThreatGraph - Interactive Threat Relationship Visualization
 * Displays interconnected nodes showing relationships between:
 * - CVEs ↔ Keywords ↔ Domains
 * - Social Intel ↔ Themes ↔ Technical Indicators
 * Uses force-directed layout simulation for organic positioning
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './threat-graph.css';

// Node types for the graph
type NodeType = 'cve' | 'domain' | 'keyword' | 'theme' | 'author' | 'central' | 'severity';

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: string[];
  data?: any;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  engagement?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: 'cve-keyword' | 'keyword-theme' | 'domain-cve' | 'author-theme' | 'central';
}

interface ThreatGraphProps {
  indicators: {
    cves: string[];
    domains: string[];
    keywords: string[];
  };
  socialIntel?: {
    themes: string[];
    topPosts: Array<{
      author: string;
      excerpt: string;
      engagement: number;
    }>;
  };
  riskScore: number;
  riskLevel: string;
  highlightedConcept?: string | null;
  onNodeClick?: (nodeId: string, nodeType: NodeType) => void;
}

const NODE_COLORS: Record<NodeType, { fill: string; stroke: string; glow: string }> = {
  central: { fill: '#0a0a0a', stroke: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)' },
  cve: { fill: '#1a0a0a', stroke: '#ff4444', glow: 'rgba(255, 68, 68, 0.3)' },
  domain: { fill: '#0a1a1a', stroke: '#00d4ff', glow: 'rgba(0, 212, 255, 0.3)' },
  keyword: { fill: '#1a1a0a', stroke: '#ffcc00', glow: 'rgba(255, 204, 0, 0.3)' },
  theme: { fill: '#1a0a1a', stroke: '#cc66ff', glow: 'rgba(204, 102, 255, 0.3)' },
  author: { fill: '#0a1a0a', stroke: '#66ff66', glow: 'rgba(102, 255, 102, 0.3)' },
  severity: { fill: '#0a0a1a', stroke: '#4488ff', glow: 'rgba(68, 136, 255, 0.3)' }
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  critical: '#E31B23',
  elevated: '#FF6B35',
  moderate: '#FFB800',
  low: '#00D26A'
};

const ThreatGraph: React.FC<ThreatGraphProps> = ({
  indicators,
  socialIntel,
  riskScore,
  riskLevel,
  highlightedConcept,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(true);

  // Resize observer
  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(400, width), height: Math.max(300, height) });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Build graph data from props
  const graphData = useMemo(() => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    // Central node - Risk Score
    newNodes.push({
      id: 'central',
      label: `Risk: ${riskScore}`,
      type: 'central',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      connections: [],
      severity: riskLevel as any
    });

    // Add CVE nodes in a ring
    const cveRadius = 150;
    indicators.cves.forEach((cve, i) => {
      const angle = (i / Math.max(1, indicators.cves.length)) * Math.PI * 2 - Math.PI / 2;
      const id = `cve-${cve}`;
      newNodes.push({
        id,
        label: cve,
        type: 'cve',
        x: cx + Math.cos(angle) * cveRadius + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * cveRadius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        connections: ['central'],
        severity: 'high'
      });
      newEdges.push({ source: 'central', target: id, strength: 0.8, type: 'central' });
      newNodes[0].connections.push(id);
    });

    // Add Domain nodes
    const domainRadius = 200;
    const domainsToShow = indicators.domains.slice(0, 8);
    domainsToShow.forEach((domain, i) => {
      const angle = (i / domainsToShow.length) * Math.PI * 2 + Math.PI / 4;
      const id = `domain-${domain}`;
      newNodes.push({
        id,
        label: domain.length > 15 ? domain.substring(0, 15) + '...' : domain,
        type: 'domain',
        x: cx + Math.cos(angle) * domainRadius + (Math.random() - 0.5) * 30,
        y: cy + Math.sin(angle) * domainRadius + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        connections: []
      });

      // Connect domains to relevant CVEs
      indicators.cves.forEach(cve => {
        newEdges.push({ source: id, target: `cve-${cve}`, strength: 0.3, type: 'domain-cve' });
      });
    });

    // Add Keyword nodes
    const keywordRadius = 120;
    indicators.keywords.forEach((keyword, i) => {
      const angle = (i / indicators.keywords.length) * Math.PI * 2 + Math.PI / 3;
      const id = `keyword-${keyword}`;
      newNodes.push({
        id,
        label: keyword,
        type: 'keyword',
        x: cx + Math.cos(angle) * keywordRadius + (Math.random() - 0.5) * 25,
        y: cy + Math.sin(angle) * keywordRadius + (Math.random() - 0.5) * 25,
        vx: 0,
        vy: 0,
        connections: ['central']
      });
      newEdges.push({ source: 'central', target: id, strength: 0.6, type: 'central' });
    });

    // Add Theme nodes from social intel
    if (socialIntel?.themes) {
      const themeRadius = 180;
      socialIntel.themes.forEach((theme, i) => {
        const angle = (i / socialIntel.themes.length) * Math.PI * 2 - Math.PI / 6;
        const id = `theme-${theme}`;
        newNodes.push({
          id,
          label: theme,
          type: 'theme',
          x: cx + Math.cos(angle) * themeRadius + (Math.random() - 0.5) * 20,
          y: cy + Math.sin(angle) * themeRadius + (Math.random() - 0.5) * 20,
          vx: 0,
          vy: 0,
          connections: []
        });

        // Connect themes to keywords
        indicators.keywords.forEach(keyword => {
          if (theme.toLowerCase().includes(keyword.toLowerCase().split(' ')[0]) ||
              keyword.toLowerCase().includes(theme.toLowerCase().split(' ')[0])) {
            newEdges.push({ source: id, target: `keyword-${keyword}`, strength: 0.5, type: 'keyword-theme' });
          }
        });
      });
    }

    // Add top author nodes
    if (socialIntel?.topPosts) {
      const authorRadius = 250;
      const topAuthors = socialIntel.topPosts.slice(0, 4);
      topAuthors.forEach((post, i) => {
        const angle = (i / topAuthors.length) * Math.PI * 2 + Math.PI / 2;
        const id = `author-${post.author}`;
        newNodes.push({
          id,
          label: `@${post.author}`,
          type: 'author',
          x: cx + Math.cos(angle) * authorRadius + (Math.random() - 0.5) * 40,
          y: cy + Math.sin(angle) * authorRadius + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          connections: [],
          engagement: post.engagement
        });

        // Connect authors to themes
        socialIntel?.themes.forEach(theme => {
          if (post.excerpt.toLowerCase().includes(theme.toLowerCase().split(' ')[0])) {
            newEdges.push({ source: id, target: `theme-${theme}`, strength: 0.4, type: 'author-theme' });
          }
        });
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [indicators, socialIntel, riskScore, riskLevel, dimensions]);

  // Initialize nodes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData]);

  // Force simulation
  useEffect(() => {
    if (!isAnimating || nodes.length === 0) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;

        // Apply forces
        newNodes.forEach((node, i) => {
          if (node.type === 'central') return; // Central node stays fixed

          // Centering force
          node.vx += (cx - node.x) * 0.001;
          node.vy += (cy - node.y) * 0.001;

          // Repulsion between nodes
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = Math.min(500 / (dist * dist), 2);
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          });

          // Edge attraction
          edges.forEach(edge => {
            if (edge.source === node.id || edge.target === node.id) {
              const otherId = edge.source === node.id ? edge.target : edge.source;
              const other = newNodes.find(n => n.id === otherId);
              if (other) {
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                node.vx += (dx / dist) * edge.strength * 0.5;
                node.vy += (dy / dist) * edge.strength * 0.5;
              }
            }
          });

          // Damping
          node.vx *= 0.9;
          node.vy *= 0.9;

          // Apply velocity
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints
          const padding = 50;
          node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
          node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    // Stop animation after a while for performance
    const timeout = setTimeout(() => setIsAnimating(false), 5000);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearTimeout(timeout);
    };
  }, [isAnimating, edges, dimensions]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev === node.id ? null : node.id);
    onNodeClick?.(node.id.replace(/^(cve|domain|keyword|theme|author)-/, ''), node.type);
  }, [onNodeClick]);

  // Get node size based on type
  const getNodeSize = (node: GraphNode): number => {
    switch (node.type) {
      case 'central': return 45;
      case 'cve': return 35;
      case 'keyword': return 30;
      case 'theme': return 32;
      case 'domain': return 25;
      case 'author': return 28;
      default: return 25;
    }
  };

  // Check if edge is highlighted
  const isEdgeHighlighted = (edge: GraphEdge): boolean => {
    if (!highlightedConcept && !selectedNode && !hoveredNode) return false;
    const checkId = highlightedConcept || selectedNode || hoveredNode;
    return edge.source.includes(checkId || '') || edge.target.includes(checkId || '');
  };

  return (
    <div className="threat-graph-container">
      <div className="threat-graph-header">
        <div className="threat-graph-title">
          <span className="threat-graph-icon">🕸️</span>
          <span>Threat Relationship Map</span>
        </div>
        <div className="threat-graph-actions">
          <button 
            className="threat-graph-action-btn"
            onClick={() => setIsAnimating(true)}
            title="Re-animate"
          >
            ⟳
          </button>
          <button 
            className="threat-graph-action-btn"
            onClick={() => setSelectedNode(null)}
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="threat-graph-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: NODE_COLORS.cve.stroke }} />
          <span>CVEs</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: NODE_COLORS.domain.stroke }} />
          <span>Domains</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: NODE_COLORS.keyword.stroke }} />
          <span>Keywords</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: NODE_COLORS.theme.stroke }} />
          <span>Themes</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: NODE_COLORS.author.stroke }} />
          <span>Authors</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="threat-graph-svg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filters for each node type */}
          {Object.entries(NODE_COLORS).map(([type, colors]) => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={colors.glow} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* Animated gradient for edges */}
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 255, 136, 0.1)" />
            <stop offset="50%" stopColor="rgba(0, 255, 136, 0.5)" />
            <stop offset="100%" stopColor="rgba(0, 255, 136, 0.1)" />
          </linearGradient>

          <linearGradient id="edge-gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 255, 200, 0.2)" />
            <stop offset="50%" stopColor="rgba(0, 255, 200, 0.8)" />
            <stop offset="100%" stopColor="rgba(0, 255, 200, 0.2)" />
          </linearGradient>

          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 136, 0.05)" strokeWidth="1"/>
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        <g className="threat-graph-edges">
          {edges.map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted = isEdgeHighlighted(edge);

            return (
              <line
                key={`edge-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                className={`threat-edge ${isHighlighted ? 'highlighted' : ''}`}
                stroke={isHighlighted ? 'url(#edge-gradient-active)' : 'rgba(50, 255, 150, 0.15)'}
                strokeWidth={isHighlighted ? 2 : 1}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="threat-graph-nodes">
          {nodes.map((node) => {
            const size = getNodeSize(node);
            const colors = NODE_COLORS[node.type];
            const isActive = selectedNode === node.id || 
                            hoveredNode === node.id || 
                            (highlightedConcept && node.id.includes(highlightedConcept));

            return (
              <g
                key={node.id}
                className={`threat-node ${node.type} ${isActive ? 'active' : ''}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer glow ring for active nodes */}
                {isActive && (
                  <circle
                    r={size + 10}
                    className="node-glow-ring"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="2"
                    opacity="0.3"
                  />
                )}

                {/* Main node circle */}
                <circle
                  r={size}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isActive ? 3 : 2}
                  filter={isActive ? `url(#glow-${node.type})` : undefined}
                  className="node-circle"
                />

                {/* Inner gradient overlay */}
                <circle
                  r={size - 3}
                  fill={`url(#radial-${node.type})`}
                  opacity="0.3"
                />

                {/* Risk score for central node */}
                {node.type === 'central' && (
                  <>
                    <text
                      y="-5"
                      textAnchor="middle"
                      className="central-score"
                      fill={RISK_LEVEL_COLORS[riskLevel] || '#00ff88'}
                      fontSize="18"
                      fontWeight="bold"
                    >
                      {riskScore}
                    </text>
                    <text
                      y="12"
                      textAnchor="middle"
                      className="central-label"
                      fill="#999"
                      fontSize="9"
                    >
                      RISK
                    </text>
                  </>
                )}

                {/* Node label */}
                {node.type !== 'central' && (
                  <text
                    y={size + 15}
                    textAnchor="middle"
                    className="node-label"
                    fill="#ccc"
                    fontSize="10"
                  >
                    {node.label.length > 18 ? node.label.substring(0, 18) + '...' : node.label}
                  </text>
                )}

                {/* Type icon */}
                {node.type !== 'central' && (
                  <text
                    y="4"
                    textAnchor="middle"
                    fontSize="14"
                    className="node-icon"
                  >
                    {node.type === 'cve' ? '🐛' :
                     node.type === 'domain' ? '🌐' :
                     node.type === 'keyword' ? '🔑' :
                     node.type === 'theme' ? '🔥' :
                     node.type === 'author' ? '👤' : '•'}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredNode && (
        <div className="threat-graph-tooltip">
          {nodes.find(n => n.id === hoveredNode)?.label}
        </div>
      )}
    </div>
  );
};

export default ThreatGraph;
