/**
 * CTI Dashboard v4.0 - Modern Threat Intelligence Visualization
 * Interactive Correlation Topology + Analysis-First Design
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types matching the JSON structure
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
  ctiAnalysis?: { model: string; killChainPhase: string; threatLandscape: string; analystBrief?: string; correlationStrength?: string; technicalAssessment?: string; methodologies?: string[] };
  assessmentLayer?: { correlation: { score: number; strength: string; explanation: string }; narrative: string; iocStats: { uniqueCVECount: number; uniqueDomainCount: number; uniqueIPCount: number; totalIndicators: number }; baselineComparison?: { previousRiskScore: number; currentRiskScore: number; delta: number; trendDirection: string } };
  modelMetadata?: { strategic: string; technical: string };
}

// Custom Node Component - Expandable
const CTINode = ({ data, selected }: { data: { label: string; type: string; size?: number; info?: string; connections?: string[]; isExpanded?: boolean }; selected?: boolean }) => {
  const getNodeStyle = (type: string) => {
    switch (type) {
      case 'cve':
        return { bg: '#E31B23', glow: 'rgba(227, 27, 35, 0.6)', light: 'rgba(227, 27, 35, 0.15)' };
      case 'domain':
        return { bg: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)', light: 'rgba(59, 130, 246, 0.15)' };
      case 'keyword':
        return { bg: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)', light: 'rgba(139, 92, 246, 0.15)' };
      case 'actor':
        return { bg: '#00D26A', glow: 'rgba(0, 210, 106, 0.6)', light: 'rgba(0, 210, 106, 0.15)' };
      case 'killchain':
        return { bg: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)', light: 'rgba(245, 158, 11, 0.15)' };
      case 'root':
        return { bg: '#00D26A', glow: 'rgba(0, 210, 106, 0.9)', light: 'rgba(0, 210, 106, 0.15)' };
      default:
        return { bg: '#6B7280', glow: 'rgba(107, 114, 128, 0.6)', light: 'rgba(107, 114, 128, 0.15)' };
    }
  };

  const style = getNodeStyle(data.type);
  const baseSize = data.size || 120;
  const isExpanded = data.isExpanded ?? selected;

  if (isExpanded) {
    return (
      <div
        className="cti-node-expanded"
        style={{
          background: `linear-gradient(180deg, ${style.bg}dd 0%, ${style.bg}99 100%)`,
          boxShadow: `0 0 40px ${style.glow}, 0 0 80px ${style.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
          width: 320,
          minHeight: 200,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          color: '#fff',
          padding: '16px',
          border: '2px solid rgba(255,255,255,0.4)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'pointer',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        <Handle type="target" position={Position.Left} style={{ background: '#fff', width: 10, height: 10 }} />
        
        {/* Header */}
        <div style={{
          fontFamily: 'Space Grotesk',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '12px',
          textAlign: 'center',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          width: '100%',
        }}>
          {data.label.replace('\n', ' ')}
        </div>

        {/* Info Content */}
        {data.info && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '10px',
            width: '100%',
            marginBottom: '10px',
            fontSize: '11px',
            lineHeight: 1.5,
            color: '#ddd',
            whiteSpace: 'pre-line',
            maxHeight: '80px',
            overflow: 'auto',
          }}>
            {data.info}
          </div>
        )}

        {/* Connections */}
        {data.connections && data.connections.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Correlated with
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {data.connections.slice(0, 4).map((conn, i) => (
                <span key={i} style={{
                  padding: '3px 8px',
                  background: style.light,
                  border: `1px solid ${style.bg}`,
                  borderRadius: '12px',
                  fontSize: '9px',
                  color: '#fff',
                }}>
                  {conn}
                </span>
              ))}
            </div>
          </div>
        )}

        <Handle type="source" position={Position.Right} style={{ background: '#fff', width: 10, height: 10 }} />
      </div>
    );
  }

  return (
    <div
      className="cti-node"
      style={{
        background: style.bg,
        boxShadow: `0 0 20px ${style.glow}, 0 0 40px ${style.glow}`,
        width: baseSize,
        height: baseSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: baseSize > 80 ? '11px' : '9px',
        fontWeight: 600,
        textAlign: 'center',
        padding: '8px',
        border: '2px solid rgba(255,255,255,0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        zIndex: 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#fff', width: 8, height: 8 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', lineHeight: 1.2 }}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} style={{ background: '#fff', width: 8, height: 8 }} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  ctiNode: CTINode,
};

// Color utilities
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return '#E31B23';
    case 'high': return '#FF6B35';
    case 'medium': return '#FFB800';
    case 'low': return '#00D26A';
    default: return '#6B7280';
  }
};

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'critical': return '#E31B23';
    case 'elevated': return '#FF6B35';
    case 'moderate': return '#FFB800';
    case 'low': return '#00D26A';
    default: return '#6B7280';
  }
};

// Main Component
const CTIDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Map<string, any>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/data/cti-dashboard.json?_cb=${Date.now()}`);
      if (!response.ok) throw new Error('Dashboard data not available');
      const dashboardData = await response.json();
      setData(dashboardData);
      generateGraph(dashboardData);
      setError(null);
    } catch (err) {
      setError('Intelligence data currently unavailable');
      console.error('Failed to load CTI dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate force-directed graph from data
  const generateGraph = (dashboardData: DashboardData) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeId = 0;

    // Root node - Threat Landscape
    newNodes.push({
      id: 'root',
      type: 'ctiNode',
      position: { x: 0, y: 0 },
      data: { 
        label: 'THREAT\nLANDSCAPE', 
        type: 'root', 
        size: 140,
        info: `Risk Score: ${dashboardData.status.riskScore}/100\nLevel: ${dashboardData.status.riskLevel}\nTrend: ${dashboardData.status.trend}`,
        connections: [`Kill Chain: ${dashboardData.ctiAnalysis?.killChainPhase}`, `${dashboardData.metrics.totalSignals} Signals`]
      },
    });

    // Keywords as central nodes
    const keywords = dashboardData.indicators?.keywords || [];
    keywords.forEach((kw, i) => {
      const id = `keyword_${nodeId++}`;
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: 250 + i * 180, y: -150 + Math.random() * 300 },
        data: { 
          label: kw.split(' ')[0].toUpperCase(), 
          type: 'keyword', 
          size: 100,
          info: `Category: ${kw}\nRelated CVEs: ${dashboardData.indicators?.cves?.length || 0}\nSources: Social Intel`,
          connections: keywords
        },
      });
      newEdges.push({
        id: `edge_root_${id}`,
        source: 'root',
        target: id,
        animated: true,
        style: { stroke: '#8B5CF6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
      });
    });

    // CVEs
    const cves = dashboardData.indicators?.cves || [];
    cves.forEach((cve, i) => {
      const id = `cve_${nodeId++}`;
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: -400 + i * 250, y: 200 + Math.random() * 150 },
        data: { 
          label: cve.replace('CVE-', ''), 
          type: 'cve', 
          size: 90,
          info: `CVE: ${cve}\nStatus: Stale\nRelevance: Medium`,
          connections: ['Zero-Day Vulnerabilities', 'Microsoft Office']
        },
      });
      keywords.forEach((kw, ki) => {
        if (kw.toLowerCase().includes('vulnerability') || kw.toLowerCase().includes('breach')) {
          newEdges.push({
            id: `edge_${id}_kw${ki}`,
            source: id,
            target: `keyword_${ki}`,
            style: { stroke: '#E31B23', strokeWidth: 2, strokeDasharray: '5,5' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#E31B23' },
          });
        }
      });
    });

    // Domains
    const domains = dashboardData.indicators?.domains?.slice(0, 5) || [];
    domains.forEach((domain, i) => {
      const id = `domain_${nodeId++}`;
      const label = domain.length > 15 ? domain.substring(0, 12) + '..' : domain;
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: 500 + i * 150, y: 250 + Math.random() * 200 },
        data: { 
          label: label.toUpperCase(), 
          type: 'domain', 
          size: 85,
          info: `Domain: ${domain}\nCategory: Threat Intelligence Source`,
          connections: ['Data Breaches', 'Ransomware Attacks']
        },
      });
      newEdges.push({
        id: `edge_${id}_kw`,
        source: id,
        target: `keyword_${i % keywords.length}`,
        style: { stroke: '#3B82F6', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
      });
    });

    // Kill Chain Phase
    const killChain = dashboardData.ctiAnalysis?.killChainPhase || 'Unknown';
    newNodes.push({
      id: 'killchain',
      type: 'ctiNode',
      position: { x: -500, y: -200 },
      data: { 
        label: killChain.toUpperCase(), 
        type: 'killchain', 
        size: 100,
        info: `Phase: ${killChain}\nCorrelation: ${dashboardData.assessmentLayer?.correlation?.strength || 'weak'}`,
        connections: ['Weaponization', 'Reconnaissance']
      },
    });
    newEdges.push({
      id: 'edge_root_kc',
      source: 'root',
      target: 'killchain',
      style: { stroke: '#F59E0B', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
    });

    // Threat Actors from social intel
    const actors = dashboardData.socialIntel?.topPosts?.slice(0, 4) || [];
    actors.forEach((post, i) => {
      const id = `actor_${nodeId++}`;
      const label = post.author.length > 12 ? post.author.substring(0, 10) + '..' : post.author;
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: -250 + i * 180, y: 400 + Math.random() * 80 },
        data: { 
          label: label.toUpperCase(), 
          type: 'actor', 
          size: 85,
          info: `Author: @${post.author}\nEngagement: ${post.engagement}\nTheme: ${dashboardData.socialIntel?.themes?.[0] || 'N/A'}`,
          connections: dashboardData.indicators?.keywords || []
        },
      });
      keywords.forEach((kw, ki) => {
        newEdges.push({
          id: `edge_${id}_${ki}`,
          source: id,
          target: `keyword_${ki}`,
          style: { stroke: '#00D26A', strokeWidth: 1, strokeDasharray: '3,3' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#00D26A' },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const isSupernode = (nodeId: string) => {
    return nodeId === 'root' || nodeId.startsWith('keyword_');
  };

  const getDirectConnections = (nodeId: string): string[] => {
    return edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => e.source === nodeId ? e.target : e.source);
  };

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      if (expandedNodes.size > 0) {
        setExpandedNodes(new Map());
        setHighlightedEdges([]);
      }
    }
  }, [expandedNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    
    const isCurrentlyExpanded = expandedNodes.has(node.id);
    
    if (isCurrentlyExpanded) {
      const newExpanded = new Map(expandedNodes);
      newExpanded.delete(node.id);
      setExpandedNodes(newExpanded);
      
      if (newExpanded.size === 0) {
        setHighlightedEdges([]);
      } else {
        const remainingExpanded = Array.from(newExpanded.keys());
        const connectedEdgeIds = edges
          .filter(e => remainingExpanded.includes(e.source) || remainingExpanded.includes(e.target))
          .map(e => e.id);
        setHighlightedEdges(connectedEdgeIds);
      }
    } else {
      const newExpanded = new Map(expandedNodes);
      newExpanded.set(node.id, node.data);
      setExpandedNodes(newExpanded);
      
      const newConnectedEdgeIds = edges
        .filter(e => e.source === node.id || e.target === node.id)
        .map(e => e.id);
      
      const allConnectedEdgeIds = [...highlightedEdges, ...newConnectedEdgeIds];
      setHighlightedEdges([...new Set(allConnectedEdgeIds)]);
    }
  }, [expandedNodes, edges, highlightedEdges]);

  const onConnectionClick = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      const targetNodeId = edge.target;
      const targetNode = nodes.find(n => n.id === targetNodeId);
      if (targetNode) {
        const newExpanded = new Map(expandedNodes);
        newExpanded.set(targetNodeId, targetNode.data);
        setExpandedNodes(newExpanded);
        
        const connectedEdgeIds = edges
          .filter(e => e.source === targetNodeId || e.target === targetNodeId)
          .map(e => e.id);
        setHighlightedEdges(prev => [...new Set([...prev, ...connectedEdgeIds])]);
      }
    }
  }, [edges, nodes, expandedNodes]);

  // Loading State
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#00D26A',
        fontFamily: 'Space Grotesk, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid #111',
            borderTop: '3px solid #00D26A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '14px', letterSpacing: '4px' }}>INITIALIZING CTI</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#E31B23',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠</div>
          <div>{error || 'Data unavailable'}</div>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(data.status.riskLevel);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Left Panel - Analysis & Metrics (Primary Content) */}
      <div style={{
        width: '400px',
        minWidth: '400px',
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #222',
          background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        }}>
          <div style={{ 
            fontFamily: 'Space Grotesk, sans-serif', 
            fontSize: '20px', 
            fontWeight: 700,
            color: '#00D26A',
            marginBottom: '8px',
            letterSpacing: '1px',
          }}>
            THREAT INTELLIGENCE
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Generated: {new Date(data.meta.generatedAt).toLocaleString()}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Risk Score Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Risk Score
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: `${riskColor}20`,
                border: `1px solid ${riskColor}`,
                color: riskColor,
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {data.status.riskLevel.toUpperCase()}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Ring Gauge */}
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke={riskColor} strokeWidth="10"
                    strokeDasharray={`${data.status.riskScore * 2.51} 251`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                    {data.status.riskScore}
                  </span>
                  <span style={{ fontSize: '10px', color: '#666' }}>/100</span>
                </div>
              </div>
              
              {/* Metrics */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <MetricBox label="Critical" value={data.metrics.criticalCount} color="#E31B23" />
                  <MetricBox label="High" value={data.metrics.highCount} color="#FF6B35" />
                  <MetricBox label="Medium" value={data.metrics.mediumCount} color="#FFB800" />
                  <MetricBox label="Low" value={data.metrics.lowCount} color="#00D26A" />
                </div>
              </div>
            </div>
            
            {/* Trend */}
            <div style={{ 
              marginTop: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '12px',
              color: data.status.trend === 'decreasing' ? '#00D26A' : '#E31B23',
            }}>
              <span>{data.status.trend === 'decreasing' ? '↓' : '↑'}</span>
              <span>Trend: {data.status.trend.charAt(0).toUpperCase() + data.status.trend.slice(1)}</span>
              <span style={{ color: '#666', marginLeft: '8px' }}>
                Confidence: {data.status.confidenceLevel}%
              </span>
            </div>
          </div>

          {/* Executive Summary - PROMINENT */}
          <Section title="EXECUTIVE SUMMARY">
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #0f1a0f 0%, #0a140a 100%)',
              borderRadius: '12px',
              border: `1px solid ${riskColor}40`,
              boxShadow: `0 0 30px ${riskColor}15`,
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: riskColor,
                  boxShadow: `0 0 10px ${riskColor}`,
                }} />
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: riskColor,
                  fontFamily: 'Space Grotesk',
                }}>
                  {data.executive.headline}
                </div>
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: '#aaa', 
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}>
                {data.executive.summary.replace(/\*\*/g, '')}
              </p>
              
              {/* Key Findings Highlight */}
              {data.executive.keyFindings && data.executive.keyFindings.length > 0 && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px',
                  background: 'rgba(0, 210, 106, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid #00D26A30',
                }}>
                  <div style={{ fontSize: '10px', color: '#00D26A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Key Findings
                  </div>
                  {data.executive.keyFindings.map((finding, i) => (
                    <div key={i} style={{ 
                      fontSize: '12px', 
                      color: '#ccc', 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{ color: '#00D26A' }}>▸</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* CTI Analysis - PRIMARY */}
          <Section title="THREAT ANALYSIS">
            <div style={{
              padding: '16px',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #00D26A30',
              boxShadow: '0 0 20px rgba(0, 210, 106, 0.1)',
            }}>
              {/* Kill Chain */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Kill Chain Phase</span>
                <div style={{ 
                  marginTop: '4px',
                  padding: '6px 12px',
                  background: '#F59E0B20',
                  border: '1px solid #F59E0B',
                  borderRadius: '4px',
                  color: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-block',
                }}>
                  {data.ctiAnalysis?.killChainPhase || 'N/A'}
                </div>
              </div>

              {/* Correlation */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Correlation Strength</span>
                <div style={{ 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '100px',
                    height: '6px',
                    background: '#222',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(data.assessmentLayer?.correlation?.score || 0) * 100}%`,
                      height: '100%',
                      background: data.assessmentLayer?.correlation?.strength === 'weak' ? '#E31B23' : '#00D26A',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    color: data.assessmentLayer?.correlation?.strength === 'weak' ? '#E31B23' : '#00D26A',
                    textTransform: 'uppercase',
                  }}>
                    {data.assessmentLayer?.correlation?.strength || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Classification */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Classification</span>
                <div style={{ 
                  marginTop: '4px',
                  padding: '6px 12px',
                  background: '#8B5CF620',
                  border: '1px solid #8B5CF6',
                  borderRadius: '4px',
                  color: '#8B5CF6',
                  fontSize: '12px',
                }}>
                  {(data.assessmentLayer?.classification?.type || 'opportunistic').toUpperCase()} 
                  <span style={{ color: '#666', marginLeft: '8px' }}>
                    {(data.assessmentLayer?.classification?.confidence || 30)}% confidence
                  </span>
                </div>
              </div>

              {/* Technical Assessment - Terminal Style */}
              <div>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Technical Assessment</span>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#000',
                  borderRadius: '6px',
                  border: '1px solid #222',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#00D26A',
                  maxHeight: '150px',
                  overflow: 'auto',
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: '8px', color: '#666' }}>
                    {`> ANALYZING THREAT INDICATORS...`}
                  </div>
                  {data.ctiAnalysis?.technicalAssessment?.substring(0, 400) || 'No technical assessment available'}
                  <div style={{ marginTop: '8px', color: '#666' }}>
                    {`> ANALYSIS COMPLETE`}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Indicators */}
          <Section title="INDICATORS">
            {/* CVEs */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>CVEs</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {data.indicators.cves?.map((cve, i) => (
                  <span key={i} style={{
                    padding: '4px 8px',
                    background: '#E31B2320',
                    border: '1px solid #E31B23',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#E31B23',
                    fontFamily: 'monospace',
                  }}>
                    {cve}
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Threat Categories</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {data.indicators.keywords?.map((kw, i) => (
                  <span key={i} style={{
                    padding: '4px 8px',
                    background: '#8B5CF620',
                    border: '1px solid #8B5CF6',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#8B5CF6',
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* Social Intel */}
          <Section title="SOCIAL INTELLIGENCE">
            {data.socialIntel?.topPosts?.slice(0, 3).map((post, i) => (
              <div key={i} style={{
                padding: '12px',
                background: '#111',
                borderRadius: '6px',
                border: '1px solid #222',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#00D26A' }}>
                    @{post.author}
                  </span>
                  <span style={{ fontSize: '10px', color: '#666' }}>
                    {post.engagement} engagement
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.5 }}>
                  {post.excerpt.substring(0, 120)}...
                </p>
              </div>
            ))}
          </Section>

          {/* Recommended Actions - PROMINENT */}
          <Section title="RECOMMENDED ACTIONS">
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #1a0f0f 0%, #0f0a0a 100%)',
              borderRadius: '12px',
              border: '1px solid #E31B2340',
              boxShadow: '0 0 30px rgba(227, 27, 35, 0.1)',
            }}>
              <div style={{ fontSize: '10px', color: '#E31B23', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Mitigation Steps
              </div>
              {data.executive.recommendedActions?.map((action, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E31B23 0%, #FF6B35 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: '#ccc',
                    lineHeight: 1.5,
                    paddingTop: '2px',
                  }}>
                    {action.replace(/^\.\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Right Panel - Interactive Graph */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Graph Header */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          padding: '12px 20px',
          background: 'rgba(10, 10, 10, 0.9)',
          borderRadius: '8px',
          border: '1px solid #222',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ 
            fontFamily: 'Space Grotesk', 
            fontSize: '14px', 
            fontWeight: 600,
            color: '#fff',
          }}>
            CORRELATION TOPOLOGY
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            Interactive Threat Map • {data.metrics.totalSignals} Signals
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10,
          padding: '12px 16px',
          background: 'rgba(10, 10, 10, 0.9)',
          borderRadius: '8px',
          border: '1px solid #222',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Legend</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
            <LegendItem color="#E31B23" label="CVEs" />
            <LegendItem color="#3B82F6" label="Domains" />
            <LegendItem color="#8B5CF6" label="Keywords" />
            <LegendItem color="#00D26A" label="Actors" />
            <LegendItem color="#F59E0B" label="Kill Chain" />
          </div>
        </div>

        {/* React Flow Graph */}
        <ReactFlow
          nodes={nodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const isConnected = Array.from(expandedNodes.keys()).some(key => 
              key === node.id || edges.some(e => (e.source === key && e.target === node.id) || (e.target === key && e.source === node.id))
            );
            const shouldDim = expandedNodes.size > 0 && !isExpanded && !isConnected;
            
            return {
              ...node,
              data: {
                ...node.data,
                isExpanded,
              },
              style: {
                ...node.style,
                opacity: shouldDim ? 0.15 : 1,
                transition: isDragging ? 'none' : 'all 0.3s ease',
                zIndex: isExpanded ? 100 : 1,
              },
            };
          })}
          edges={edges.map(edge => {
            const isHighlighted = highlightedEdges.includes(edge.id);
            const shouldDim = expandedNodes.size > 0 && !isHighlighted;
            
            return {
              ...edge,
              animated: isHighlighted ? true : edge.animated,
              style: {
                ...edge.style,
                stroke: isHighlighted 
                  ? (edge.style?.stroke === '#E31B23' ? '#FF4444' : 
                     edge.style?.stroke === '#8B5CF6' ? '#A78BFA' :
                     edge.style?.stroke === '#3B82F6' ? '#60A5FA' :
                     edge.style?.stroke === '#00D26A' ? '#4ADE80' : '#FBBF24')
                  : (shouldDim ? '#333' : edge.style?.stroke),
                strokeWidth: isHighlighted ? 4 : (edge.style?.strokeWidth || 2),
                opacity: shouldDim ? 0.2 : 1,
                transition: 'all 0.3s ease',
              },
            };
          })}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={(_, edge) => onConnectionClick(edge.id)}
          onNodeDragStart={() => setIsDragging(true)}
          onNodeDragStop={() => setIsDragging(false)}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ background: '#0a0a0a' }}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          <Background color="#222" gap={30} size={1} />
          <Controls 
            style={{ 
              background: '#111', 
              border: '1px solid #222',
              borderRadius: '8px',
            }} 
          />
          <MiniMap 
            nodeColor={(node) => {
              const type = node.data?.type || 'default';
              const colors: Record<string, string> = {
                cve: '#E31B23',
                domain: '#3B82F6',
                keyword: '#8B5CF6',
                actor: '#00D26A',
                killchain: '#F59E0B',
                root: '#00D26A',
              };
              return colors[type] || '#6B7280';
            }}
            style={{ 
              background: '#111', 
              border: '1px solid #222',
              borderRadius: '8px',
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

// Helper Components
const MetricBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{
    padding: '8px',
    background: '#111',
    borderRadius: '6px',
    border: `1px solid ${color}30`,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '18px', fontWeight: 700, color, fontFamily: 'Space Grotesk' }}>
      {value}
    </div>
    <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>
      {label}
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ 
      fontSize: '11px', 
      color: '#666', 
      textTransform: 'uppercase', 
      letterSpacing: '1px',
      marginBottom: '10px',
      paddingBottom: '6px',
      borderBottom: '1px solid #222',
    }}>
      {title}
    </div>
    {children}
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 8px ${color}80`,
    }} />
    <span style={{ color: '#888' }}>{label}</span>
  </div>
);

export default CTIDashboard;
