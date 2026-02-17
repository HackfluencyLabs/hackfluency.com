/**
 * CTI Dashboard v4.0 - Modern Threat Intelligence Visualization
 * Interactive Correlation Topology + Analysis-First Design
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { I18nProvider, useI18n, LanguageSwitcher } from '../../i18n/index.jsx';

// Types matching the JSON structure
interface DashboardData {
  meta: { version: string; generatedAt: string; validUntil: string };
  status: { riskLevel: string; riskScore: number; trend: string; confidenceLevel: number };
  executive: { headline: string; summary: string; keyFindings: string[]; recommendedActions: string[] };
  metrics: { totalSignals: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; categories: Array<{ name: string; count: number; percentage: number }> };
  timeline: Array<{ id: string; title: string; severity: string; category: string; timestamp: string; sourceUrl?: string }>;
  sources: Array<{ name: string; signalCount: number; lastUpdate: string }>;
  indicators: { cves: string[]; domains: string[]; ips: string[]; keywords: string[] };
  infrastructure?: { totalHosts: number; exposedPorts: Array<{ port: number; service: string; count: number; percentage: number }>; topCountries: Array<{ country: string; count: number }>; vulnerableHosts: number; sampleHosts?: Array<{ ip: string; port: number; service: string; vulns: string[] }> };
  socialIntel?: { totalPosts: number; themes: string[]; tone: string; topPosts: Array<{ excerpt: string; author: string; engagement: number; url?: string }> };
  ctiAnalysis?: { model: string; killChainPhase: string; threatLandscape: string; analystBrief?: string; correlationStrength?: string; technicalAssessment?: string; methodologies?: string[] };
  assessmentLayer?: {
    correlation: { score: number; strength: string; explanation: string; factors?: { cveOverlap: number; serviceMatch: number; temporalProximity: number; infraSocialAlignment: number } };
    scoring?: { weights?: Record<string, number>; components?: Record<string, number>; computedScore: number; confidenceLevel: number };
    baselineComparison?: { previousRiskScore: number; currentRiskScore: number; delta: number; anomalyLevel?: string; trendDirection: string };
    freshness?: { socialAgeHours: number; infraAgeHours: number; freshnessScore: number; status: string };
    classification?: { type: string; confidence: number; rationale?: string; indicators?: string[] };
    iocStats: { uniqueCVECount: number; uniqueDomainCount: number; uniqueIPCount: number; totalIndicators: number; uniquePortCount?: number; uniqueServiceCount?: number; duplicationRatio?: number };
    narrative: string;
  };
  modelMetadata?: { strategic: string; technical: string; quantization?: string; version?: string };
}

// Node style palette
const NODE_STYLES: Record<string, { bg: string; glow: string; light: string }> = {
  cve:       { bg: '#E31B23', glow: 'rgba(227, 27, 35, 0.6)',  light: 'rgba(227, 27, 35, 0.15)' },
  domain:    { bg: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)',  light: 'rgba(59, 130, 246, 0.15)' },
  keyword:   { bg: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)',  light: 'rgba(139, 92, 246, 0.15)' },
  actor:     { bg: '#00D26A', glow: 'rgba(0, 210, 106, 0.6)',   light: 'rgba(0, 210, 106, 0.15)' },
  killchain: { bg: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)',  light: 'rgba(245, 158, 11, 0.15)' },
  root:      { bg: '#00D26A', glow: 'rgba(0, 210, 106, 0.9)',   light: 'rgba(0, 210, 106, 0.15)' },
};
const DEFAULT_NODE_STYLE = { bg: '#6B7280', glow: 'rgba(107, 114, 128, 0.6)', light: 'rgba(107, 114, 128, 0.15)' };

// Risk color palette
const RISK_COLORS: Record<string, string> = {
  critical: '#E31B23',
  elevated: '#FF6B35',
  moderate: '#FFB800',
  low: '#00D26A',
};

// Source link attached to a node or detail section
interface SourceLink {
  label: string;
  url: string;
  icon: string; // emoji/unicode icon
}

// Custom Node Component - Expandable
interface CTINodeData {
  label: string;
  type: string;
  size?: number;
  info?: string;
  connections?: string[];
  links?: SourceLink[];
  isExpanded?: boolean;
  expandable?: boolean;
  childCount?: number;
  hidden?: boolean;
  parentId?: string;
  t?: (key: string) => string;
}

const CTINode = ({ data }: { data: CTINodeData }) => {
  const t = data.t || ((key: string) => key);
  const style = NODE_STYLES[data.type] || DEFAULT_NODE_STYLE;
  const baseSize = data.size || 120;
  const isExpanded = data.isExpanded ?? false;

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
              {t('dashboard.correlatedWith')}
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

        {/* Source Links */}
        {data.links && data.links.length > 0 && (
          <div style={{ width: '100%', marginTop: '10px' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
{t('dashboard.sources')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {data.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '9px',
                    color: '#7DB4F5',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.25)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.12)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{link.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>↗</span>
                </a>
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
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#fff', width: 8, height: 8 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', lineHeight: 1.2 }}>
        {data.label}
      </span>
      {data.expandable && data.childCount > 0 && (
        <div style={{
          position: 'absolute',
          top: -4,
          right: -4,
          background: '#10B981',
          color: '#fff',
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: 700,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          border: '2px solid #0a0a0a',
        }}>
          +{data.childCount}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#fff', width: 8, height: 8 }} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  ctiNode: CTINode,
};

// Tab types
type TabId = 'executive' | 'correlation' | 'detail';

const TABS: { id: TabId; labelKey: string; icon: string }[] = [
  { id: 'executive', labelKey: 'tab.executive', icon: '◈' },
  { id: 'correlation', labelKey: 'tab.correlation', icon: '◉' },
  { id: 'detail', labelKey: 'tab.detail', icon: '☰' },
];

// Main Component with I18n Provider wrapper
const CTIDashboardWithI18n: React.FC = () => {
  return (
    <I18nProvider>
      <CTIDashboardInner />
    </I18nProvider>
  );
};

// Inner component that uses i18n hooks
const CTIDashboardInner: React.FC = () => {
  const { t, language } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Map<string, any>>(new Map());
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('executive');
  const [socialAgeHovered, setSocialAgeHovered] = useState(false);
  const [infraAgeHovered, setInfraAgeHovered] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const dashboardFile = language === 'es' ? '/data/cti-dashboard-es.json' : '/data/cti-dashboard.json';

  // Load data
  useEffect(() => {
    loadDashboard();
  }, [language]);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${dashboardFile}?_cb=${Date.now()}`);
      if (!response.ok) throw new Error('Dashboard data not available');
      const dashboardData = await response.json();
      setData(dashboardData);
      generateGraph(dashboardData, t);
      setError(null);
    } catch (err) {
      setError('Intelligence data currently unavailable');
      console.error('Failed to load CTI dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate data-driven correlation graph
  // Edges are drawn ONLY where real data relationships exist
  const generateGraph = (dashboardData: DashboardData, translateFn: (key: string) => string) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const correlation = dashboardData.assessmentLayer?.correlation;
    const factors = correlation?.factors;
    const cveOverlap = factors?.cveOverlap ?? 0;
    const serviceMatch = factors?.serviceMatch ?? 0;
    const temporalProximity = factors?.temporalProximity ?? 0;

    // ── Source cluster nodes (the two primary data sources) ──
    // Collect all social post URLs for the source node
    const allPostUrls: SourceLink[] = (dashboardData.socialIntel?.topPosts || []).filter(p => p.url).map(p => ({
      label: `@${p.author}`,
      url: p.url!,
      icon: '𝕏',
    }));

    const posts = dashboardData.socialIntel?.topPosts?.slice(0, 5) || [];
    const infraCves = dashboardData.indicators?.cves?.slice(1) || [];
    const shownInfraCves = infraCves.slice(0, 6);

    newNodes.push({
      id: 'social_source',
      type: 'ctiNode',
      position: { x: -450, y: 0 },
      data: {
        label: translateFn('node.socialIntel'),
        type: 'actor',
        size: 130,
        expandable: true,
        childCount: posts.length,
        info: `${translateFn('node.source')}: X.com\n${translateFn('node.posts')}: ${dashboardData.socialIntel?.totalPosts || 0}\n${translateFn('node.tone')}: ${dashboardData.socialIntel?.tone || translateFn('node.na')}\n${translateFn('node.themes')}: ${dashboardData.socialIntel?.themes?.join(', ') || translateFn('node.na')}`,
        connections: [`${dashboardData.socialIntel?.totalPosts || 0} Posts`, `Tone: ${dashboardData.socialIntel?.tone || 'mixed'}`],
        links: [
          { label: 'X.com Search', url: `https://x.com/search?q=${encodeURIComponent(dashboardData.indicators?.keywords?.[0] || 'cybersecurity')}`, icon: '𝕏' },
          ...allPostUrls.slice(0, 3),
        ],
      },
    });

    // Build Shodan search links from exposed services
    const shodanLinks: SourceLink[] = (dashboardData.infrastructure?.exposedPorts || []).slice(0, 2).map(svc => ({
      label: `Shodan: ${svc.service.split(' ')[0]}`,
      url: `https://www.shodan.io/search?query=product:"${encodeURIComponent(svc.service.split(' ')[0])}"`,
      icon: '🔍',
    }));

    // Get infrastructure data for expandable info
    const sampleHosts = dashboardData.infrastructure?.sampleHosts || [];
    const totalHosts = dashboardData.infrastructure?.totalHosts || 0;
    const vulnerableCount = dashboardData.infrastructure?.vulnerableHosts || 0;
    const exposedPorts = dashboardData.infrastructure?.exposedPorts || [];
    const topCountries = dashboardData.infrastructure?.topCountries || [];
    const allCVEs = [...new Set(sampleHosts.flatMap(h => h.vulns || []))];
    
    // Build comprehensive breakdown for expandable section
    const infraBreakdown = [
      `📊 ${translateFn('infra.totalScanned').replace('{count}', String(totalHosts))}`,
      `⚠️ ${translateFn('infra.vulnerable').replace('{count}', String(vulnerableCount)).replace('{percentage}', String(Math.round((vulnerableCount / Math.max(totalHosts, 1)) * 100)))}`,
      '',
      `🌍 ${translateFn('infra.byCountry')}`,
      ...topCountries.map(c => `  • ${c.country}: ${c.count} ${translateFn('infra.hosts')}`),
      '',
      `🛠️ ${translateFn('infra.byService')}`,
      ...exposedPorts.slice(0, 5).map(s => `  • ${s.service}:${s.port} - ${s.count} ${translateFn('infra.hosts')} (${s.percentage}%)`),
      '',
      `🚨 ${translateFn('infra.topCVEs').replace('{count}', String(sampleHosts.length))}`,
      ...allCVEs.slice(0, 10).map(c => `  • ${c}`),
      '',
      `📋 ${translateFn('infra.sampleHosts').replace('{count}', String(sampleHosts.length)).replace('{total}', String(vulnerableCount))}`,
      ...sampleHosts.map(h => `  • ${h.ip}:${h.port} (${h.service}) - ${h.vulns?.length || 0} ${translateFn('infra.cves')}`)
    ].join('\n');

    newNodes.push({
      id: 'infra_source',
      type: 'ctiNode',
      position: { x: 450, y: 0 },
      data: {
        label: translateFn('node.infraScan'),
        type: 'domain',
        size: 130,
        expandable: true,
        childCount: shownInfraCves.length,
        info: `${translateFn('node.source')}: Shodan\n${translateFn('node.totalHosts')}: ${totalHosts}\n${translateFn('node.vulnerable')}: ${vulnerableCount}\n${translateFn('node.exposure')}: ${((vulnerableCount / Math.max(totalHosts, 1)) * 100).toFixed(1)}%\n\n${infraBreakdown}`,
        connections: [`${totalHosts} Hosts`, `${vulnerableCount} Vulnerable`],
        links: [
          { label: 'Shodan Dashboard', url: 'https://www.shodan.io/dashboard', icon: '🔍' },
          ...shodanLinks,
        ],
      },
    });

    // ── Central correlation hub ──
    const corrScore = correlation?.score ?? 0;
    const corrStrength = correlation?.strength ?? 'weak';
    const corrPct = Math.round(corrScore * 100);
    newNodes.push({
      id: 'correlation_hub',
      type: 'ctiNode',
      position: { x: 0, y: 0 },
      data: {
        label: `${corrPct}%\n${translateFn('node.correlation')}`,
        type: corrStrength === 'strong' ? 'root' : corrStrength === 'moderate' ? 'killchain' : 'keyword',
        size: 140,
        info: `${translateFn('assessment.correlation')}: ${translateFn(`correlation.strength.${corrStrength}`)} (${corrPct}%)\n${translateFn('dashboard.cveOverlap')}: ${Math.round(cveOverlap * 100)}%\n${translateFn('dashboard.serviceMatch')}: ${Math.round(serviceMatch * 100)}%\n${translateFn('dashboard.temporalProximity')}: ${Math.round(temporalProximity * 100)}%\n${translateFn('dashboard.infraSocialAlignment')}: ${Math.round((factors?.infraSocialAlignment ?? 0) * 100)}%`,
        connections: [correlation?.explanation || t('dashboard.noExplanation')],
      },
    });

    // Edges from sources to correlation hub — thickness based on actual factor contribution
    const socialEdgeWidth = Math.max(1, (temporalProximity + cveOverlap) * 4);
    const infraEdgeWidth = Math.max(1, (temporalProximity + serviceMatch) * 4);

    newEdges.push({
      id: 'edge_social_corr',
      source: 'social_source',
      target: 'correlation_hub',
      animated: temporalProximity > 0.3,
      style: { stroke: '#00D26A', strokeWidth: socialEdgeWidth, strokeDasharray: corrStrength === 'weak' ? '8,6' : undefined },
      label: `${translateFn('dashboard.temporalProximity')} ${Math.round(temporalProximity * 100)}%`,
      labelStyle: { fill: '#888', fontSize: 10, fontFamily: 'Space Grotesk' },
      labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00D26A' },
    });

    newEdges.push({
      id: 'edge_infra_corr',
      source: 'infra_source',
      target: 'correlation_hub',
      animated: serviceMatch > 0.3,
      style: { stroke: '#3B82F6', strokeWidth: infraEdgeWidth, strokeDasharray: corrStrength === 'weak' ? '8,6' : undefined },
      label: `${translateFn('dashboard.cveOverlap')} ${Math.round(cveOverlap * 100)}%`,
      labelStyle: { fill: '#888', fontSize: 10, fontFamily: 'Space Grotesk' },
      labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
    });

    // ── Social intel sub-nodes (actors) ──
    posts.forEach((post, i) => {
      const id = `actor_${i}`;
      const label = post.author.length > 12 ? post.author.substring(0, 10) + '..' : post.author;
      const angle = (-Math.PI / 2) + (i / Math.max(posts.length - 1, 1)) * Math.PI;
      const actorLinks: SourceLink[] = [];
      if (post.url) actorLinks.push({ label: 'View Post on X', url: post.url, icon: '𝕏' });
      actorLinks.push({ label: `@${post.author} Profile`, url: `https://x.com/${post.author}`, icon: '👤' });

      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: -450 + Math.cos(angle) * 220, y: Math.sin(angle) * 200 },
        data: {
          label: label.toUpperCase(),
          type: 'actor',
          size: 75,
          parentId: 'social_source',
          hidden: true,
          info: `Author: @${post.author}\nEngagement: ${post.engagement}\n${post.excerpt?.substring(0, 100)}...`,
          connections: dashboardData.socialIntel?.themes?.slice(0, 2) || [],
          links: actorLinks,
        },
      });
      newEdges.push({
        id: `edge_${id}_social`,
        source: id,
        target: 'social_source',
        style: { stroke: '#00D26A', strokeWidth: 1.5, strokeDasharray: '3,3' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00D26A' },
      });
    });

    // ── Infrastructure CVE sub-nodes (from Shodan) ──
    shownInfraCves.forEach((cve, i) => {
      const id = `infra_cve_${i}`;
      const angle = (-Math.PI / 2) + (i / Math.max(shownInfraCves.length - 1, 1)) * Math.PI;
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: 450 + Math.cos(angle) * 220, y: Math.sin(angle) * 200 },
        data: {
          label: cve.replace('CVE-', ''),
          type: 'cve',
          size: 70,
          parentId: 'infra_source',
          hidden: true,
          info: `${translateFn('node.cve')}: ${cve}\n${translateFn('node.source')}: ${translateFn('node.shodanInfra')}\n${translateFn('node.foundIn')}: ${translateFn('node.vulnerableHosts')}`,
          connections: ['Infrastructure Only'],
          links: [
            { label: 'NVD Detail', url: `https://nvd.nist.gov/vuln/detail/${cve}`, icon: '🛡' },
            { label: 'MITRE Entry', url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`, icon: '📋' },
          ],
        },
      });
      newEdges.push({
        id: `edge_${id}_infra`,
        source: id,
        target: 'infra_source',
        style: { stroke: '#E31B23', strokeWidth: 1.5, strokeDasharray: '3,3' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#E31B23' },
      });
    });

    // ── Cross-source CVE node (the REAL overlap, if any) ──
    const socialCves = dashboardData.indicators?.cves?.slice(0, 1) || [];
    if (socialCves.length > 0 && cveOverlap > 0) {
      // Only show as cross-source if there IS actual overlap
      const overlapCve = socialCves[0];
      newNodes.push({
        id: 'overlap_cve',
        type: 'ctiNode',
        position: { x: 0, y: -200 },
        data: {
          label: overlapCve.replace('CVE-', ''),
          type: 'root',
          size: 100,
          info: `CVE: ${overlapCve}\n⚡ CROSS-SOURCE: Found in BOTH\nsocial intelligence AND infrastructure\nThis is evidence of real correlation`,
          connections: ['Social Intel', 'Infrastructure'],
          links: [
            { label: 'NVD Detail', url: `https://nvd.nist.gov/vuln/detail/${overlapCve}`, icon: '🛡' },
            { label: 'MITRE Entry', url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${overlapCve}`, icon: '📋' },
            { label: 'Search on X', url: `https://x.com/search?q=${encodeURIComponent(overlapCve)}`, icon: '𝕏' },
          ],
        },
      });
      newEdges.push({
        id: 'edge_overlap_social',
        source: 'overlap_cve',
        target: 'social_source',
        animated: true,
        style: { stroke: '#FFB800', strokeWidth: 3 },
        label: t('dashboard.mentionedInPosts'),
        labelStyle: { fill: '#FFB800', fontSize: 10 },
        labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#FFB800' },
      });
      newEdges.push({
        id: 'edge_overlap_infra',
        source: 'overlap_cve',
        target: 'infra_source',
        animated: true,
        style: { stroke: '#FFB800', strokeWidth: 3 },
        label: t('dashboard.foundInScans'),
        labelStyle: { fill: '#FFB800', fontSize: 10 },
        labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#FFB800' },
      });
    } else if (socialCves.length > 0) {
      // CVE mentioned in social only — no infra overlap
      newNodes.push({
        id: 'social_cve',
        type: 'ctiNode',
        position: { x: -200, y: -220 },
        data: {
          label: socialCves[0].replace('CVE-', ''),
          type: 'cve',
          size: 80,
          info: `${translateFn('node.cve')}: ${socialCves[0]}\n${translateFn('node.source')}: ${translateFn('node.socialIntelOnly')}\n⚠ ${translateFn('node.notFoundInfra')}\n${translateFn('node.noCrossValidation')}`,
          connections: ['Social Intel Only'],
          links: [
            { label: 'NVD Detail', url: `https://nvd.nist.gov/vuln/detail/${socialCves[0]}`, icon: '🛡' },
            { label: 'Search on X', url: `https://x.com/search?q=${encodeURIComponent(socialCves[0])}`, icon: '𝕏' },
          ],
        },
      });
      newEdges.push({
        id: 'edge_socialcve_social',
        source: 'social_cve',
        target: 'social_source',
        style: { stroke: '#E31B23', strokeWidth: 2, strokeDasharray: '5,5' },
        label: t('dashboard.socialOnly'),
        labelStyle: { fill: '#888', fontSize: 9 },
        labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#E31B23' },
      });
      // Dashed line to infra showing NO connection
      newEdges.push({
        id: 'edge_socialcve_noinfra',
        source: 'social_cve',
        target: 'infra_source',
        style: { stroke: '#333', strokeWidth: 1, strokeDasharray: '2,6' },
        label: t('dashboard.noMatch'),
        labelStyle: { fill: '#555', fontSize: 9 },
        labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
      });
    }

    // ── Kill Chain Phase (connected to correlation hub) ──
    const killChain = dashboardData.ctiAnalysis?.killChainPhase || 'Unknown';
    newNodes.push({
      id: 'killchain',
      type: 'ctiNode',
      position: { x: 0, y: 250 },
      data: {
        label: killChain.toUpperCase(),
        type: 'killchain',
        size: 95,
        info: `${translateFn('dashboard.killChain')}: ${killChain}\n${translateFn('assessment.classification')}: ${translateFn(`classification.type.${dashboardData.assessmentLayer?.classification?.type || 'unknown'}`)}\n${translateFn('status.confidence')}: ${dashboardData.assessmentLayer?.classification?.confidence || 0}%\n${dashboardData.assessmentLayer?.classification?.rationale || ''}`,
        connections: dashboardData.assessmentLayer?.classification?.indicators || [],
        links: [
          { label: 'MITRE ATT&CK', url: 'https://attack.mitre.org/', icon: '🎯' },
          { label: translateFn('dashboard.killChainModel'), url: 'https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html', icon: '📋' },
        ],
      },
    });
    newEdges.push({
      id: 'edge_corr_kc',
      source: 'correlation_hub',
      target: 'killchain',
      style: { stroke: '#F59E0B', strokeWidth: 2 },
      label: translateFn(`classification.type.${dashboardData.assessmentLayer?.classification?.type || 'unknown'}`),
      labelStyle: { fill: '#F59E0B', fontSize: 10 },
      labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
    });

    // ── Keywords as theme indicators (attached to social source) ──
    const keywords = dashboardData.indicators?.keywords || [];
    keywords.forEach((kw, i) => {
      const id = `keyword_${i}`;
      const angle = Math.PI + (i / Math.max(keywords.length - 1, 1)) * (Math.PI / 2);
      newNodes.push({
        id,
        type: 'ctiNode',
        position: { x: -450 + Math.cos(angle) * 280, y: Math.sin(angle) * 160 },
        data: {
          label: kw.split(' ')[0].toUpperCase(),
          type: 'keyword',
          size: 70,
          info: `${translateFn('node.theme')}: ${kw}\n${translateFn('node.source')}: ${translateFn('node.socialIntelligence')}\n${translateFn('node.extractedFrom')}`,
          connections: [kw],
          links: [
            { label: `Search "${kw.split(' ')[0]}" on X`, url: `https://x.com/search?q=${encodeURIComponent(kw)}`, icon: '𝕏' },
          ],
        },
      });
      newEdges.push({
        id: `edge_${id}_social`,
        source: id,
        target: 'social_source',
        style: { stroke: '#8B5CF6', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
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
    
    const isParentNode = node.id === 'social_source' || node.id === 'infra_source';
    
    if (isParentNode) {
      const newExpandedParents = new Set(expandedParents);
      if (newExpandedParents.has(node.id)) {
        newExpandedParents.delete(node.id);
      } else {
        newExpandedParents.add(node.id);
      }
      setExpandedParents(newExpandedParents);
    }
    
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
  }, [expandedNodes, edges, highlightedEdges, expandedParents]);

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

  // Memoize edge highlight set for O(1) lookup
  const highlightedEdgeSet = useMemo(() => new Set(highlightedEdges), [highlightedEdges]);
  const expandedKeysList = useMemo(() => Array.from(expandedNodes.keys()), [expandedNodes]);

  // Precomputed nodes with expansion/dim state
  const computedNodes = useMemo(() => {
    return nodes
      .filter(node => {
        const parentId = node.data?.parentId;
        if (parentId && node.data?.hidden) {
          return expandedParents.has(parentId);
        }
        return true;
      })
      .map((node) => {
        const parentId = node.data?.parentId;
        const isChildHidden = parentId && node.data?.hidden && !expandedParents.has(parentId);
        const isExpanded = expandedNodes.has(node.id);
        const isConnected = expandedKeysList.some(key =>
          key === node.id || edges.some(e =>
            (e.source === key && e.target === node.id) || (e.target === key && e.source === node.id)
          )
        );
        const shouldDim = expandedNodes.size > 0 && !isExpanded && !isConnected;

        return {
          ...node,
          data: { ...node.data, isExpanded },
          style: {
            ...node.style,
            opacity: isChildHidden ? 0 : (shouldDim ? 0.15 : 1),
            display: isChildHidden ? 'none' : 'block',
            transition: isDragging ? 'none' : 'all 0.3s ease',
            zIndex: isExpanded ? 100 : 1,
          },
        };
      });
  }, [nodes, expandedNodes, expandedKeysList, edges, isDragging, expandedParents]);

  // Precomputed edges with highlight/dim state
  const computedEdges = useMemo(() => {
    const HIGHLIGHT_MAP: Record<string, string> = {
      '#E31B23': '#FF4444',
      '#8B5CF6': '#A78BFA',
      '#3B82F6': '#60A5FA',
      '#00D26A': '#4ADE80',
    };

    const nodeParentMap = new Map(nodes.map(n => [n.id, n.data?.parentId]));

    return edges
      .filter(edge => {
        const sourceParent = nodeParentMap.get(edge.source);
        const targetParent = nodeParentMap.get(edge.target);
        if (sourceParent && sourceParent !== 'infra_source' && sourceParent !== 'social_source') {
          return expandedParents.has(sourceParent);
        }
        if (targetParent && targetParent !== 'infra_source' && targetParent !== 'social_source') {
          return expandedParents.has(targetParent);
        }
        return true;
      })
      .map(edge => {
      const isHighlighted = highlightedEdgeSet.has(edge.id);
      const shouldDim = expandedNodes.size > 0 && !isHighlighted;
      const baseStroke = edge.style?.stroke as string | undefined;

      return {
        ...edge,
        animated: isHighlighted || edge.animated,
        style: {
          ...edge.style,
          stroke: isHighlighted
            ? (HIGHLIGHT_MAP[baseStroke || ''] || '#FBBF24')
            : (shouldDim ? '#333' : baseStroke),
          strokeWidth: isHighlighted ? 4 : (edge.style?.strokeWidth || 2),
          opacity: shouldDim ? 0.2 : 1,
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [edges, highlightedEdgeSet, expandedNodes, expandedParents, nodes]);

  const riskColor = RISK_COLORS[data?.status?.riskLevel?.toLowerCase() ?? ''] || '#6B7280';

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
          <div style={{ fontSize: '14px', letterSpacing: '4px' }}>{t('loading.initializing')}</div>
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
          <div>{error || t('error.dataUnavailable')}</div>
        </div>
      </div>
    );
  }

  // ── Executive Summary Panel ──
  const renderExecutivePanel = () => (
    <div style={{
      flex: 1,
      overflow: 'auto',
      padding: '40px',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{ maxWidth: '900px', width: '100%' }}>
        {/* Hero Risk Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginBottom: '40px',
          padding: '32px',
          background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
          borderRadius: '16px',
          border: `1px solid ${riskColor}30`,
          boxShadow: `0 0 60px ${riskColor}10`,
        }}>
          {/* Ring Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={riskColor} strokeWidth="8"
                  strokeDasharray={`${data!.status.riskScore * 2.51} 251`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <span style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'Space Grotesk', color: riskColor }}>
                  {data!.status.riskScore}
                </span>
                <span style={{ fontSize: '11px', color: '#666' }}>/100</span>
              </div>
            </div>
            {/* Risk Scale - Permanent Display */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              padding: '12px',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #1a1a1a',
            }}>
              <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {t('dashboard.riskScale')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: '#00D26A', fontWeight: 600 }}>●</span>
                <span style={{ color: '#888' }}>{t('dashboard.riskScale.low')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: '#FFB800', fontWeight: 600 }}>●</span>
                <span style={{ color: '#888' }}>{t('dashboard.riskScale.moderate')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: '#FF6B35', fontWeight: 600 }}>●</span>
                <span style={{ color: '#888' }}>{t('dashboard.riskScale.elevated')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: '#E31B23', fontWeight: 600 }}>●</span>
                <span style={{ color: '#888' }}>{t('dashboard.riskScale.critical')}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: riskColor, boxShadow: `0 0 12px ${riskColor}`,
              }} />
              <span style={{
                fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: 700, color: riskColor,
              }}>
                {data!.executive.headline}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#888',
            }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px',
              background: `${riskColor}15`, border: `1px solid ${riskColor}60`,
              color: riskColor, fontSize: '11px', fontWeight: 600,
            }}>
              {t('status.level.' + data!.status.riskLevel)}
            </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  color: data!.status.trend === 'decreasing' ? '#00D26A' : data!.status.trend === 'stable' ? '#FFB800' : '#E31B23',
                }}>
                  {data!.status.trend === 'decreasing' ? '↓' : data!.status.trend === 'stable' ? '→' : '↑'} {t('status.trend.' + data!.status.trend)}
                </span>
                {data!.assessmentLayer?.baselineComparison && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#666', 
                    padding: '2px 8px',
                    background: '#0a0a0a',
                    borderRadius: '4px',
                    border: '1px solid #1a1a1a',
                  }}>
                    {t('dashboard.trendTooltip.previous')}: {data!.assessmentLayer.baselineComparison.previousRiskScore} → {t('dashboard.trendTooltip.current')}: {data!.assessmentLayer.baselineComparison.currentRiskScore}
                    {data!.assessmentLayer.baselineComparison.delta !== 0 && (
                      <span style={{ 
                        marginLeft: '6px', 
                        color: data!.assessmentLayer.baselineComparison.delta > 0 ? '#E31B23' : '#00D26A',
                        fontWeight: 600,
                      }}>
                        ({data!.assessmentLayer.baselineComparison.delta > 0 ? '+' : ''}{data!.assessmentLayer.baselineComparison.delta})
                      </span>
                    )}
                  </span>
                )}
              </div>
              <span>{t('status.confidence')}: {data!.status.confidenceLevel}%</span>
              <span>{data!.metrics.totalSignals} {t('metrics.totalSignals').toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Narrative */}
        {data!.assessmentLayer?.narrative && (
          <div style={{
            marginBottom: '32px',
            padding: '28px',
            background: 'linear-gradient(135deg, #0f1a0f 0%, #0a140a 100%)',
            borderRadius: '16px',
            border: '1px solid #00D26A25',
            boxShadow: '0 0 40px rgba(0, 210, 106, 0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
            }}>
              <div style={{
                width: '4px', height: '20px', borderRadius: '2px', background: '#00D26A',
              }} />
              <span style={{
                fontSize: '12px', color: '#00D26A', textTransform: 'uppercase',
                letterSpacing: '2px', fontWeight: 600,
              }}>
                {t('dashboard.intelligenceNarrative')}
              </span>
            </div>
            <p style={{
              fontSize: '15px', color: '#ccc', lineHeight: 1.8,
              margin: 0, fontStyle: 'italic',
            }}>
              {data!.assessmentLayer.narrative}
            </p>
          </div>
        )}

        {/* Key Findings + Quick Metrics Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px',
        }}>
          {/* Key Findings */}
          <div style={{
            padding: '24px', background: '#111', borderRadius: '12px',
            border: '1px solid #222',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
            }}>
              <div style={{
                width: '4px', height: '20px', borderRadius: '2px', background: '#8B5CF6',
              }} />
              <span style={{
                fontSize: '12px', color: '#8B5CF6', textTransform: 'uppercase',
                letterSpacing: '2px', fontWeight: 600,
              }}>
                {t('executive.keyFindings')}
              </span>
            </div>
            {data!.executive.keyFindings?.map((finding, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                marginBottom: '10px', fontSize: '13px', color: '#ccc', lineHeight: 1.5,
              }}>
                <span style={{ color: '#8B5CF6', flexShrink: 0, marginTop: '2px' }}>▸</span>
                <span>{finding}</span>
              </div>
            ))}
          </div>

          {/* Quick Metrics */}
          <div style={{
            padding: '24px', background: '#111', borderRadius: '12px',
            border: '1px solid #222',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
            }}>
              <div style={{
                width: '4px', height: '20px', borderRadius: '2px', background: '#3B82F6',
              }} />
              <span style={{
                fontSize: '12px', color: '#3B82F6', textTransform: 'uppercase',
                letterSpacing: '2px', fontWeight: 600,
              }}>
                {t('dashboard.signalBreakdown')}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <MetricBox label={t('metrics.critical')} value={data!.metrics.criticalCount} color="#E31B23" />
              <MetricBox label={t('metrics.high')} value={data!.metrics.highCount} color="#FF6B35" />
              <MetricBox label={t('metrics.medium')} value={data!.metrics.mediumCount} color="#FFB800" />
              <MetricBox label={t('metrics.low')} value={data!.metrics.lowCount} color="#00D26A" />
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div style={{
          padding: '28px',
          background: 'linear-gradient(135deg, #1a0f0f 0%, #0f0a0a 100%)',
          borderRadius: '16px',
          border: '1px solid #E31B2330',
          boxShadow: '0 0 40px rgba(227, 27, 35, 0.06)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
          }}>
            <div style={{
              width: '4px', height: '20px', borderRadius: '2px', background: '#E31B23',
            }} />
            <span style={{
              fontSize: '12px', color: '#E31B23', textTransform: 'uppercase',
              letterSpacing: '2px', fontWeight: 600,
            }}>
{t('dashboard.recommendedActions')}
            </span>
          </div>
          {data!.executive.recommendedActions
            ?.filter(action => action.length > 15 && !action.match(/^(RECOMMENDED|ACTIONS?\*)/i))
            .map((action, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              marginBottom: '16px', padding: '16px',
              background: 'rgba(0, 0, 0, 0.35)', borderRadius: '10px',
              border: '1px solid #E31B2315',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #E31B23 0%, #FF6B35 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{
                fontSize: '13px', color: '#ccc', lineHeight: 1.6, paddingTop: '3px',
              }}>
                {action.replace(/^\.\s*/, '').replace(/\*\*/g, '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Correlation Graph Panel ──
  const renderCorrelationPanel = () => {
    const corr = data!.assessmentLayer?.correlation;
    const scoring = data!.assessmentLayer?.scoring;
    const classification = data!.assessmentLayer?.classification;
    const freshness = data!.assessmentLayer?.freshness;
    const iocStats = data!.assessmentLayer?.iocStats;
    const corrScore = corr?.score ?? 0;
    const corrStrength = corr?.strength ?? 'weak';
    const factors = corr?.factors;

    const strengthColor = corrStrength === 'strong' ? '#00D26A' : corrStrength === 'moderate' ? '#F59E0B' : '#E31B23';

    return (
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Correlation Methodology Panel */}
        <div style={{
          width: '340px', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
          background: '#0d0d0d', borderRight: '1px solid #1a1a1a',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
          minHeight: 0, maxHeight: '100%',
        }}>
          {/* Correlation Score Header */}
          <div style={{
            padding: '20px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${strengthColor}10, transparent)`,
            border: `1px solid ${strengthColor}30`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'Space Grotesk', fontSize: '42px', fontWeight: 700,
              color: strengthColor, lineHeight: 1,
            }}>
              {Math.round(corrScore * 100)}%
            </div>
            <div style={{
              fontSize: '11px', color: strengthColor, textTransform: 'uppercase',
              letterSpacing: '2px', fontWeight: 600, marginTop: '4px',
            }}>
              {t('dashboard.correlation')} {t('correlation.strength.' + corrStrength)}
            </div>
            <div style={{
              fontSize: '10px', color: '#666', marginTop: '8px', lineHeight: 1.5,
            }}>
              {corr?.explanation || 'No explanation available'}
            </div>
          </div>

          {/* Correlation Factors Breakdown */}
          <div style={{
            padding: '16px', borderRadius: '10px',
            background: '#111', border: '1px solid #222',
          }}>
            <div style={{
              fontSize: '10px', color: '#888', textTransform: 'uppercase',
              letterSpacing: '1.5px', fontWeight: 600, marginBottom: '14px',
            }}>
              ◈ {t('dashboard.correlationFactors')}
            </div>
            {[
              { label: t('dashboard.cveOverlap'), value: factors?.cveOverlap ?? 0, desc: t('dashboard.factor.cveOverlap.desc'), color: '#E31B23' },
              { label: t('dashboard.serviceMatch'), value: factors?.serviceMatch ?? 0, desc: t('dashboard.factor.serviceMatch.desc'), color: '#3B82F6' },
              { label: t('dashboard.temporalProximity'), value: factors?.temporalProximity ?? 0, desc: t('dashboard.factor.temporalProximity.desc'), color: '#00D26A' },
              { label: t('dashboard.infraSocialAlignment'), value: factors?.infraSocialAlignment ?? 0, desc: t('dashboard.factor.infraSocialAlignment.desc'), color: '#8B5CF6' },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <span style={{ fontSize: '11px', color: '#ccc', fontWeight: 500 }}>{f.label}</span>
                  <span style={{
                    fontSize: '13px', fontWeight: 700, fontFamily: 'Space Grotesk',
                    color: f.value > 0.5 ? '#00D26A' : f.value > 0.1 ? '#F59E0B' : '#E31B23',
                  }}>
                    {Math.round(f.value * 100)}%
                  </span>
                </div>
                <div style={{
                  height: '6px', borderRadius: '3px', background: '#1a1a1a',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${Math.max(f.value * 100, 2)}%`,
                    background: `linear-gradient(90deg, ${f.color}, ${f.color}88)`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Risk Scoring Breakdown */}
          {scoring && (
            <div style={{
              padding: '16px', borderRadius: '10px',
              background: '#111', border: '1px solid #222',
            }}>
              <div style={{
                fontSize: '10px', color: '#888', textTransform: 'uppercase',
                letterSpacing: '1.5px', fontWeight: 600, marginBottom: '14px',
              }}>
                ◈ {t('dashboard.riskScoreComputation')}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #1a1a1a',
              }}>
                <span style={{ fontSize: '11px', color: '#888' }}>{t('dashboard.computedScore')}</span>
                <span style={{
                  fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk', color: riskColor,
                }}>
                  {scoring.computedScore}/100
                </span>
              </div>
              {scoring.weights && scoring.components && Object.entries(scoring.weights).map(([key, weight]) => {
                const value = (scoring.components as Record<string, number>)?.[key] ?? 0;
                const contribution = Math.round(value * (weight as number) * 100);
                return (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '6px', fontSize: '10px',
                  }}>
                    <span style={{ color: '#888', flex: 1 }}>
                      {t('scoring.' + key) || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                    <span style={{ color: '#666', width: '40px', textAlign: 'right' }}>
                      ×{((weight as number) * 100).toFixed(0)}%
                    </span>
                    <span style={{
                      color: '#ccc', fontWeight: 600, fontFamily: 'Space Grotesk',
                      width: '36px', textAlign: 'right',
                    }}>
                      {contribution}
                    </span>
                  </div>
                );
              })}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1a1a1a',
                fontSize: '10px',
              }}>
                <span style={{ color: '#888' }}>{t('dashboard.confidenceLevel')}</span>
                <span style={{ color: '#F59E0B', fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                  {scoring.confidenceLevel}%
                </span>
              </div>
            </div>
          )}

          {/* Threat Classification */}
          {classification && (
            <div style={{
              padding: '16px', borderRadius: '10px',
              background: '#111', border: '1px solid #222',
            }}>
              <div style={{
                fontSize: '10px', color: '#888', textTransform: 'uppercase',
                letterSpacing: '1.5px', fontWeight: 600, marginBottom: '12px',
              }}>
                ◈ {t('assessment.classification')}
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: `${classification.type === 'targeted' ? '#E31B23' : classification.type === 'campaign' ? '#F59E0B' : '#3B82F6'}15`,
                border: `1px solid ${classification.type === 'targeted' ? '#E31B23' : classification.type === 'campaign' ? '#F59E0B' : '#3B82F6'}30`,
                marginBottom: '10px',
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk',
                  color: classification.type === 'targeted' ? '#E31B23' : classification.type === 'campaign' ? '#F59E0B' : '#3B82F6',
                  textTransform: 'uppercase',
                }}>
                  {t('classification.type.' + classification.type)}
                </div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                  {t('status.confidence')}: {classification.confidence}%
                </div>
              </div>
              {classification.rationale && (
                <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.5, marginBottom: '8px' }}>
                  {classification.rationale}
                </div>
              )}
              {classification.indicators?.map((ind, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '10px', color: '#666', marginBottom: '4px',
                }}>
                  <span style={{ color: '#555' }}>▸</span>
                  {ind}
                </div>
              ))}
            </div>
          )}

          {/* IOC Statistics */}
          {iocStats && (
            <div style={{
              padding: '16px', borderRadius: '10px',
              background: '#111', border: '1px solid #222',
            }}>
              <div style={{
                fontSize: '10px', color: '#888', textTransform: 'uppercase',
                letterSpacing: '1.5px', fontWeight: 600, marginBottom: '12px',
              }}>
                ◈ {t('assessment.iocStats')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
            { label: t('indicators.cves'), value: iocStats.uniqueCVECount, total: data!.indicators?.cves?.length || 0 },
              { label: t('dashboard.domains'), value: iocStats.uniqueDomainCount },
              { label: t('indicators.ips'), value: iocStats.uniqueIPCount },
              { label: t('dashboard.totalIocs'), value: iocStats.totalIndicators },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '8px', borderRadius: '6px',
                    background: '#0a0a0a', border: '1px solid #1a1a1a',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '16px', fontWeight: 700, fontFamily: 'Space Grotesk',
                      color: stat.value === 0 ? '#555' : '#ccc',
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase' }}>
                      {stat.label}
                    </div>
                    {stat.total !== undefined && stat.total !== stat.value && (
                      <div style={{ fontSize: '8px', color: '#444', marginTop: '2px' }}>
                        of {stat.total} {t('dashboard.listed')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {iocStats.duplicationRatio !== undefined && (
                <div style={{
                  fontSize: '9px', color: '#555', marginTop: '8px',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{t('dashboard.crossSourceDuplication')}</span>
                  <span style={{ color: (iocStats.duplicationRatio ?? 0) > 0 ? '#F59E0B' : '#555' }}>
                    {Math.round((iocStats.duplicationRatio ?? 0) * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Data Freshness */}
          {freshness && (
            <div style={{
              padding: '16px', borderRadius: '10px',
              background: '#111', border: '1px solid #222',
            }}>
              <div style={{
                fontSize: '10px', color: '#888', textTransform: 'uppercase',
                letterSpacing: '1.5px', fontWeight: 600, marginBottom: '12px',
              }}>
                ◈ {t('dashboard.dataFreshness')}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px',
              }}>
                <span style={{ color: '#888' }}>{t('status.risk')}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '9px',
                  background: freshness.status === 'high' ? '#00D26A20' : freshness.status === 'moderate' ? '#F59E0B20' : '#E31B2320',
                  color: freshness.status === 'high' ? '#00D26A' : freshness.status === 'moderate' ? '#F59E0B' : '#E31B23',
                  border: `1px solid ${freshness.status === 'high' ? '#00D26A' : freshness.status === 'moderate' ? '#F59E0B' : '#E31B23'}40`,
                }}>
                  {freshness.status.toUpperCase()}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px',
              }}>
                <span 
                  style={{ color: '#888', cursor: 'help' }}
                  onMouseEnter={() => setSocialAgeHovered(true)}
                  onMouseLeave={() => setSocialAgeHovered(false)}
                >
                  {t('dashboard.socialDataAge')}
                  {socialAgeHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      zIndex: 100,
                      width: '200px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}>
                      <span style={{ fontSize: '10px', color: '#888' }}>{t('dashboard.socialAgeTooltip')}</span>
                    </div>
                  )}
                </span>
                <span style={{ color: '#ccc', fontFamily: 'Space Grotesk' }}>{freshness.socialAgeHours}h</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', position: 'relative',
              }}>
                <span 
                  style={{ color: '#888', cursor: 'help' }}
                  onMouseEnter={() => setInfraAgeHovered(true)}
                  onMouseLeave={() => setInfraAgeHovered(false)}
                >
                  {t('dashboard.infrastructureAge')}
                  {infraAgeHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      zIndex: 100,
                      width: '200px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}>
                      <span style={{ fontSize: '10px', color: '#888' }}>{t('dashboard.infraAgeTooltip')}</span>
                    </div>
                  )}
                </span>
                <span style={{ color: '#ccc', fontFamily: 'Space Grotesk' }}>{freshness.infraAgeHours}h</span>
              </div>
              <div style={{
                height: '4px', borderRadius: '2px', background: '#1a1a1a', marginTop: '8px',
              }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  width: `${freshness.freshnessScore * 100}%`,
                  background: freshness.status === 'high' ? '#00D26A' : freshness.status === 'moderate' ? '#F59E0B' : '#E31B23',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Graph Visualization */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Graph Header */}
          <div style={{
            position: 'absolute', top: '16px', left: '16px', zIndex: 10,
            padding: '10px 16px',
            background: 'rgba(10, 10, 10, 0.9)',
            borderRadius: '8px', border: '1px solid #222',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: 600, color: '#fff',
            }}>
              ◈ {t('dashboard.correlationMapTitle')}
            </div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>
              {t('dashboard.correlationMapLegend')}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 10,
            padding: '10px 14px',
            background: 'rgba(10, 10, 10, 0.9)',
            borderRadius: '8px', border: '1px solid #222',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('dashboard.nodeTypes')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px' }}>
              <LegendItem color="#00D26A" label={t('dashboard.socialIntel')} />
              <LegendItem color="#3B82F6" label={t('dashboard.infrastructure')} />
              <LegendItem color="#E31B23" label={t('indicators.cves')} />
              <LegendItem color="#8B5CF6" label={t('dashboard.themes')} />
              <LegendItem color="#F59E0B" label={t('dashboard.killChainLegend')} />
            </div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('dashboard.edgeMeaning')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '2px', background: '#FFB800' }} />
                <span style={{ color: '#888' }}>{t('dashboard.crossSourceMatch')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '2px', background: '#555', borderTop: '2px dashed #555' }} />
                <span style={{ color: '#888' }}>{t('dashboard.noMatchFound')}</span>
              </div>
            </div>
          </div>

          {/* React Flow Graph */}
          <ReactFlow
            nodes={computedNodes}
            edges={computedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={(_, edge) => onConnectionClick(edge.id)}
            onNodeDragStart={() => setIsDragging(true)}
            onNodeDragStop={() => setIsDragging(false)}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            style={{ background: '#0a0a0a' }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background color="#1a1a1a" gap={30} size={1} />
            <Controls style={{ background: '#111', border: '1px solid #222', borderRadius: '8px' }} />
            <MiniMap
              nodeColor={(node) => {
                const nodeType = (node.data as Record<string, unknown>)?.type as string || 'default';
                const colors: Record<string, string> = {
                  cve: '#E31B23', domain: '#3B82F6', keyword: '#8B5CF6',
                  actor: '#00D26A', killchain: '#F59E0B', root: '#00D26A',
                };
                return colors[nodeType] || '#6B7280';
              }}
              style={{ background: '#111', border: '1px solid #222', borderRadius: '8px' }}
              maskColor="rgba(0, 0, 0, 0.8)"
            />
          </ReactFlow>
        </div>
      </div>
    );
  };

  // ── Full Detail Panel ──
  const renderDetailPanel = () => (
    <div style={{
      flex: 1, overflow: 'auto', padding: '40px',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: '1100px', width: '100%' }}>
        {/* Risk Score + Metrics Header Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginBottom: '32px',
        }}>
          {/* Risk Gauge */}
          <div style={{
            padding: '24px', background: '#111', borderRadius: '12px',
            border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '20px',
          }}>
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={riskColor} strokeWidth="10"
                  strokeDasharray={`${data!.status.riskScore * 2.51} 251`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                  {data!.status.riskScore}
                </span>
                <span style={{ fontSize: '10px', color: '#666' }}>/100</span>
              </div>
            </div>
            <div>
              <span style={{
                padding: '4px 12px', borderRadius: '20px',
                background: `${riskColor}20`, border: `1px solid ${riskColor}`,
                color: riskColor, fontSize: '11px', fontWeight: 600,
              }}>
                {t('status.level.' + data!.status.riskLevel)}
              </span>
              <div style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                color: data!.status.trend === 'decreasing' ? '#00D26A' : data!.status.trend === 'stable' ? '#FFB800' : '#E31B23',
              }}>
                <span>{data!.status.trend === 'decreasing' ? '↓' : data!.status.trend === 'stable' ? '→' : '↑'}</span>
                <span>{t('status.trend.' + data!.status.trend)}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            padding: '24px', background: '#111', borderRadius: '12px', border: '1px solid #222',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <MetricBox label={t('metrics.critical')} value={data!.metrics.criticalCount} color="#E31B23" />
              <MetricBox label={t('metrics.high')} value={data!.metrics.highCount} color="#FF6B35" />
              <MetricBox label={t('metrics.medium')} value={data!.metrics.mediumCount} color="#FFB800" />
              <MetricBox label={t('metrics.low')} value={data!.metrics.lowCount} color="#00D26A" />
            </div>
          </div>
        </div>

        {/* Two-column detail layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div>
            {/* Executive Summary */}
            <Section title={t('section.executiveSummary')}>
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #0f1a0f 0%, #0a140a 100%)',
                borderRadius: '12px',
                border: `1px solid ${riskColor}40`,
                boxShadow: `0 0 30px ${riskColor}15`,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: riskColor, boxShadow: `0 0 10px ${riskColor}`,
                  }} />
                  <div style={{
                    fontSize: '16px', fontWeight: 700, color: riskColor, fontFamily: 'Space Grotesk',
                  }}>
                    {data!.executive.headline}
                  </div>
                </div>
                <p style={{
                  fontSize: '13px', color: '#aaa', lineHeight: 1.7, whiteSpace: 'pre-line',
                }}>
                  {data!.executive.summary.replace(/\*\*/g, '')}
                </p>
                {data!.executive.keyFindings && data!.executive.keyFindings.length > 0 && (
                  <div style={{
                    marginTop: '16px', padding: '12px',
                    background: 'rgba(0, 210, 106, 0.1)',
                    borderRadius: '8px', border: '1px solid #00D26A30',
                  }}>
                    <div style={{ fontSize: '10px', color: '#00D26A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
{t('dashboard.keyFindings')}
                    </div>
                    {data!.executive.keyFindings.map((finding, i) => (
                      <div key={i} style={{
                        fontSize: '12px', color: '#ccc', display: 'flex',
                        alignItems: 'flex-start', gap: '8px', marginBottom: '4px',
                      }}>
                        <span style={{ color: '#00D26A' }}>▸</span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* Threat Analysis */}
            <Section title={t('section.threatAnalysis')}>
              <div style={{
                padding: '16px', background: '#0a0a0a', borderRadius: '8px',
                border: '1px solid #00D26A30', boxShadow: '0 0 20px rgba(0, 210, 106, 0.1)',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('cti.killChain')}</span>
                  <div style={{
                    marginTop: '4px', marginLeft: '8px', padding: '6px 12px', background: '#F59E0B20',
                    border: '1px solid #F59E0B', borderRadius: '4px', color: '#F59E0B',
                    fontSize: '12px', fontWeight: 600, display: 'inline-block',
                  }}>
                    {data!.ctiAnalysis?.killChainPhase || 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.correlationStrength')}</span>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(data!.assessmentLayer?.correlation?.score || 0) * 100}%`,
                        height: '100%',
                        background: data!.assessmentLayer?.correlation?.strength === 'weak' ? '#E31B23' : '#00D26A',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px', textTransform: 'uppercase',
                      color: data!.assessmentLayer?.correlation?.strength === 'weak' ? '#E31B23' : '#00D26A',
                    }}>
                      {t('correlation.strength.' + (data!.assessmentLayer?.correlation?.strength || 'unknown'))}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('assessment.classification')}</span>
                  <div style={{
                    marginTop: '4px', padding: '6px 12px', background: '#8B5CF620',
                    border: '1px solid #8B5CF6', borderRadius: '4px', color: '#8B5CF6', fontSize: '12px',
                  }}>
                    {(t('classification.type.' + (data!.assessmentLayer?.classification?.type || 'opportunistic'))).toUpperCase()}
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      {(data!.assessmentLayer?.classification?.confidence || 30)}% {t('status.confidence').toLowerCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.technicalAssessment')}</span>
                  <div style={{
                    marginTop: '8px', padding: '16px', background: '#000', borderRadius: '6px',
                    border: '1px solid #222', fontSize: '11px', fontFamily: 'monospace',
                    color: '#00D26A',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    <div style={{ marginBottom: '10px', color: '#666', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                      {t('dashboard.analyzingThreatIndicators')}
                    </div>
                    {(() => {
                      const raw = data!.ctiAnalysis?.technicalAssessment || t('dashboard.noTechnicalAssessment');
                      const cleaned = raw
                        .replace(/\*\*(\d+\.\s*)/g, '\n$1')
                        .replace(/\*\*/g, '')
                        .replace(/^\* /gm, '  • ')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                      // Detect if the LLM output was truncated (ends mid-sentence)
                      const lastChar = raw.trim().slice(-1);
                      const isTruncated = lastChar === ',' || lastChar === ';' || (lastChar !== '.' && lastChar !== '!' && lastChar !== '?' && raw.trim().length > 200);
                      // Split into paragraphs for better rendering
                      return (
                        <>
                          {cleaned.split('\n\n').map((para, idx) => (
                            <div key={idx} style={{ marginBottom: '12px' }}>
                              {para.split('\n').map((line, lidx) => (
                                <div key={lidx} style={{
                                  color: line.match(/^\d+\./) ? '#F59E0B' : line.startsWith('  •') ? '#8B5CF6' : '#00D26A',
                                  fontWeight: line.match(/^\d+\./) ? 600 : 400,
                                  marginBottom: line.match(/^\d+\./) ? '4px' : '2px',
                                }}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          ))}
                          {isTruncated && (
                            <div style={{
                              marginTop: '8px', padding: '8px 12px', borderRadius: '6px',
                              background: '#F59E0B10', border: '1px solid #F59E0B30',
                              fontSize: '10px', color: '#F59E0B', display: 'flex',
                              alignItems: 'center', gap: '8px',
                            }}>
                              <span>⚠</span>
                              <span>{t('dashboard.truncated')}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div style={{ marginTop: '10px', color: '#666', borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
                      {t('dashboard.analysisComplete')}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Social Intel */}
            <Section title={t('section.socialIntelligence')}>
              {data!.socialIntel?.topPosts?.slice(0, 3).map((post, i) => (
                <div key={i} style={{
                  padding: '12px', background: '#111', borderRadius: '6px',
                  border: '1px solid #222', marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <a href={`https://x.com/${post.author}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', fontWeight: 600, color: '#00D26A', textDecoration: 'none' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                    >
                      @{post.author}
                    </a>
                    <span style={{ fontSize: '10px', color: '#666' }}>{post.engagement} {t('dashboard.engagement')}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {post.excerpt.substring(0, 200)}{post.excerpt.length > 200 ? '...' : ''}
                  </p>
                  {post.url && (
                    <a href={post.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      marginTop: '8px', padding: '4px 12px',
                      background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px', fontSize: '10px', color: '#7DB4F5', textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.25)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.1)'; }}
                    >
                      <span>𝕏</span> {t('social.viewOnX')} <span style={{ opacity: 0.6 }}>↗</span>
                    </a>
                  )}
                </div>
              ))}
              {data!.socialIntel && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10px', color: '#666' }}>
                  <span>{t('social.totalPosts')}: {data!.socialIntel.totalPosts}</span>
                  <span>{t('social.tone')}: <span style={{
                    color: data!.socialIntel.tone === 'confirmed' ? '#E31B23' : data!.socialIntel.tone === 'speculative' ? '#FFB800' : '#888',
                    textTransform: 'uppercase',
                  }}>{data!.socialIntel.tone}</span></span>
                </div>
              )}
            </Section>

            {/* Methodology */}
            <Section title={t('section.methodology')}>
              {data!.ctiAnalysis?.analystBrief && (
                <div style={{
                  padding: '10px', background: '#111', borderRadius: '6px',
                  border: '1px solid #222', marginBottom: '12px',
                  fontSize: '11px', color: '#aaa', lineHeight: 1.5, fontFamily: 'monospace',
                }}>
                  {data!.ctiAnalysis.analystBrief}
                </div>
              )}
              {data!.ctiAnalysis?.methodologies && data!.ctiAnalysis.methodologies.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.analysisMethods')}</span>
                  <div style={{ marginTop: '6px' }}>
                    {data!.ctiAnalysis.methodologies.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '10px', color: '#888' }}>
                        <span style={{ color: '#00D26A' }}>✓</span> {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data!.modelMetadata && (
                <div>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.modelsUsed')}</span>
                  <div style={{ marginTop: '6px', padding: '10px', background: '#111', borderRadius: '6px', border: '1px solid #222', fontSize: '10px', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#666' }}>{t('dashboard.strategic')}</span>
                      <span style={{ color: '#8B5CF6' }}>{data!.modelMetadata.strategic}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#666' }}>{t('dashboard.technical')}</span>
                      <span style={{ color: '#F59E0B' }}>{data!.modelMetadata.technical}</span>
                    </div>
                    {data!.modelMetadata.quantization && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#666' }}>{t('dashboard.quantization')}</span>
                        <span style={{ color: '#888' }}>{data!.modelMetadata.quantization}</span>
                      </div>
                    )}
                    {data!.modelMetadata.version && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>{t('version')}</span>
                        <span style={{ color: '#888' }}>{data!.modelMetadata.version}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Right Column */}
          <div>
            {/* Data Sources */}
            <Section title={t('section.dataSources')}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              }}>
                {/* Shodan */}
                <a href="https://www.shodan.io/dashboard" target="_blank" rel="noopener noreferrer" style={{
                  padding: '12px', background: '#111', borderRadius: '8px',
                  border: '1px solid #3B82F630', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F680'; (e.currentTarget as HTMLElement).style.background = '#3B82F610'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F630'; (e.currentTarget as HTMLElement).style.background = '#111'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🔍</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>{t('dashboard.shodan')}</span>
                    <span style={{ fontSize: '9px', color: '#555', marginLeft: 'auto' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#666' }}>{data!.infrastructure?.totalHosts || 0} hosts scanned</span>
                </a>

                {/* X.com / Social */}
                <a href={`https://x.com/search?q=${encodeURIComponent(data!.indicators?.keywords?.[0] || 'cybersecurity')}`} target="_blank" rel="noopener noreferrer" style={{
                  padding: '12px', background: '#111', borderRadius: '8px',
                  border: '1px solid #00D26A30', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#00D26A80'; (e.currentTarget as HTMLElement).style.background = '#00D26A10'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#00D26A30'; (e.currentTarget as HTMLElement).style.background = '#111'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>𝕏</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#00D26A' }}>X.com Intel</span>
                    <span style={{ fontSize: '9px', color: '#555', marginLeft: 'auto' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#666' }}>{data!.socialIntel?.totalPosts || 0} posts analyzed</span>
                </a>

                {/* NVD */}
                <a href="https://nvd.nist.gov/" target="_blank" rel="noopener noreferrer" style={{
                  padding: '12px', background: '#111', borderRadius: '8px',
                  border: '1px solid #E31B2330', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E31B2380'; (e.currentTarget as HTMLElement).style.background = '#E31B2310'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E31B2330'; (e.currentTarget as HTMLElement).style.background = '#111'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🛡</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#E31B23' }}>NVD / NIST</span>
                    <span style={{ fontSize: '9px', color: '#555', marginLeft: 'auto' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#666' }}>{data!.indicators?.cves?.length || 0} CVEs referenced</span>
                </a>

                {/* MITRE ATT&CK */}
                <a href="https://attack.mitre.org/" target="_blank" rel="noopener noreferrer" style={{
                  padding: '12px', background: '#111', borderRadius: '8px',
                  border: '1px solid #8B5CF630', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#8B5CF680'; (e.currentTarget as HTMLElement).style.background = '#8B5CF610'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#8B5CF630'; (e.currentTarget as HTMLElement).style.background = '#111'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B5CF6' }}>MITRE ATT&CK</span>
                    <span style={{ fontSize: '9px', color: '#555', marginLeft: 'auto' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#666' }}>{t('dashboard.killChain')}: {data!.ctiAnalysis?.killChainPhase || 'N/A'}</span>
                </a>
              </div>
            </Section>

            {/* Indicators */}
            <Section title={t('section.indicators')}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('indicators.cves')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {data!.indicators.cves?.map((cve, i) => (
                    <a key={i} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: '4px 8px', background: '#E31B2320', border: '1px solid #E31B23',
                      borderRadius: '4px', fontSize: '10px', color: '#E31B23', fontFamily: 'monospace',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                      transition: 'all 0.2s ease', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E31B2340'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#E31B2320'; }}
                    >
                      🛡 {cve} <span style={{ fontSize: '9px', opacity: 0.6 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.threatCategories')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {data!.indicators.keywords?.map((kw, i) => (
                    <span key={i} style={{
                      padding: '4px 8px', background: '#8B5CF620', border: '1px solid #8B5CF6',
                      borderRadius: '4px', fontSize: '10px', color: '#8B5CF6',
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              {data!.indicators.domains && data!.indicators.domains.length > 0 && (
                <div>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.domains')}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {data!.indicators.domains.map((domain, i) => (
                      <a key={i} href={`https://www.virustotal.com/gui/domain/${domain}`} target="_blank" rel="noopener noreferrer" style={{
                        padding: '4px 8px', background: '#3B82F620', border: '1px solid #3B82F6',
                        borderRadius: '4px', fontSize: '10px', color: '#3B82F6', fontFamily: 'monospace',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.2s ease', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#3B82F640'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#3B82F620'; }}
                      >
                        🔍 {domain} <span style={{ fontSize: '9px', opacity: 0.6 }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {data!.indicators.ips && data!.indicators.ips.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('indicators.ips')}</span>
                  <div style={{ 
                    marginTop: '6px', 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    background: '#0a0a0a', 
                    borderRadius: '6px', 
                    border: '1px solid #1a1a1a',
                    padding: '8px'
                  }}>
                    {data!.indicators.ips.map((ip, i) => (
                      <div key={i} style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#00D26A',
                        borderBottom: i < data!.indicators.ips.length - 1 ? '1px solid #1a1a1a' : 'none',
                      }}>
                        {ip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data!.infrastructure?.sampleHosts && data!.infrastructure.sampleHosts.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
                    {t('dashboard.vulnerableHostsSample')} ({data!.infrastructure.sampleHosts.length} {t('dashboard.hosts').toLowerCase()})
                  </span>
                  <div style={{ 
                    marginTop: '6px', 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    background: '#0a0a0a', 
                    borderRadius: '6px', 
                    border: '1px solid #1a1a1a',
                    padding: '8px'
                  }}>
                    {data!.infrastructure.sampleHosts.map((host, i) => (
                      <div key={i} style={{
                        padding: '8px',
                        background: i % 2 === 0 ? '#111' : 'transparent',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        borderLeft: '3px solid #E31B23',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00D26A', fontWeight: 600 }}>
                            {host.ip}:{host.port}
                          </span>
                          <span style={{ fontSize: '9px', color: '#3B82F6', background: '#3B82F620', padding: '2px 6px', borderRadius: '3px' }}>
                            {host.service}
                          </span>
                        </div>
                        {host.vulns && host.vulns.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {host.vulns.slice(0, 5).map((cve, j) => (
                              <a 
                                key={j} 
                                href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'monospace',
                                  color: '#E31B23',
                                  textDecoration: 'none',
                                  padding: '1px 4px',
                                  background: '#E31B2320',
                                  borderRadius: '2px',
                                }}
                              >
                                {cve}
                              </a>
                            ))}
                            {host.vulns.length > 5 && (
                              <span style={{ fontSize: '9px', color: '#666' }}>+{host.vulns.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Infrastructure */}
            {data!.infrastructure && (
              <Section title={t('section.infrastructure')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <MetricBox label={t('dashboard.hosts')} value={data!.infrastructure.totalHosts} color="#3B82F6" />
                  <MetricBox label={t('dashboard.vulnerable')} value={data!.infrastructure.vulnerableHosts} color="#E31B23" />
                  <MetricBox label={t('dashboard.vuln')} value={Math.round((data!.infrastructure.vulnerableHosts / Math.max(data!.infrastructure.totalHosts, 1)) * 100)} color="#FF6B35" />
                </div>
                {data!.infrastructure.exposedPorts && data!.infrastructure.exposedPorts.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.exposedPorts')}</span>
                    <div style={{ marginTop: '6px' }}>
                      {data!.infrastructure.exposedPorts.map((port, i) => (
                        <a key={i} href={`https://www.shodan.io/search?query=port:${port.port}`} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 8px', background: i % 2 === 0 ? '#111' : 'transparent',
                          borderRadius: '4px', fontSize: '11px', textDecoration: 'none',
                          transition: 'all 0.2s ease', cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.1)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#111' : 'transparent'; }}
                        >
                          <span style={{ color: '#F59E0B', fontFamily: 'monospace', width: '50px' }}>{port.port}</span>
                          <span style={{ color: '#aaa', flex: 1 }}>{port.service}</span>
                          <span style={{ color: '#666', fontSize: '10px', marginRight: '8px' }}>{port.count} ({port.percentage}%)</span>
                          <span style={{ color: '#3B82F680', fontSize: '10px' }}>🔍↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {data!.infrastructure.topCountries && data!.infrastructure.topCountries.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.topCountries')}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {data!.infrastructure.topCountries.map((c, i) => (
                        <span key={i} style={{
                          padding: '4px 8px', background: '#3B82F615', border: '1px solid #3B82F640',
                          borderRadius: '4px', fontSize: '10px', color: '#3B82F6', fontFamily: 'monospace',
                        }}>
                          {c.country}: {c.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data!.infrastructure.sampleHosts && data!.infrastructure.sampleHosts.length > 0 && (
                  <div>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.vulnerableHostsSample')}</span>
                    <div style={{ marginTop: '6px' }}>
                      {data!.infrastructure.sampleHosts.map((host, i) => (
                        <div key={i} style={{
                          padding: '8px', background: '#111', borderRadius: '4px',
                          border: '1px solid #E31B2320', marginBottom: '4px',
                          fontSize: '10px', fontFamily: 'monospace',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#E31B23' }}>{host.ip}:{host.port}</span>
                            <span style={{ color: '#888' }}>{host.service}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {host.vulns.map((v, vi) => (
                              <a key={vi} href={`https://nvd.nist.gov/vuln/detail/${v}`} target="_blank" rel="noopener noreferrer" style={{
                                padding: '2px 6px', background: '#E31B2315', borderRadius: '3px', color: '#E31B23', fontSize: '9px',
                                textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E31B2335'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#E31B2315'; }}
                              >{v} ↗</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Assessment Details */}
            {data!.assessmentLayer && (
              <Section title={t('section.assessmentDetails')}>
                {data!.assessmentLayer.narrative && (
                  <div style={{
                    padding: '12px', background: '#0f1a0f', borderRadius: '8px',
                    border: '1px solid #00D26A20', marginBottom: '12px',
                    fontSize: '12px', color: '#aaa', lineHeight: 1.6, fontStyle: 'italic',
                  }}>
                    {data!.assessmentLayer.narrative}
                  </div>
                )}
                {data!.assessmentLayer.freshness && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('assessment.freshness')}</span>
                    <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '8px', background: '#111', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: data!.assessmentLayer.freshness.status === 'stale' ? '#E31B23' : data!.assessmentLayer.freshness.status === 'moderate' ? '#FFB800' : '#00D26A', fontFamily: 'Space Grotesk' }}>
                          {(data!.assessmentLayer.freshness.freshnessScore * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.score')}</div>
                      </div>
                      <div style={{ padding: '8px', background: '#111', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{
                          fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                          color: data!.assessmentLayer.freshness.status === 'stale' ? '#E31B23' : data!.assessmentLayer.freshness.status === 'moderate' ? '#FFB800' : '#00D26A',
                        }}>
                          {data!.assessmentLayer.freshness.status}
                        </div>
                        <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                          Social: {data!.assessmentLayer.freshness.socialAgeHours.toFixed(1)}h | Infra: {data!.assessmentLayer.freshness.infraAgeHours.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {data!.assessmentLayer.baselineComparison && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.baselineComparison')}</span>
                    <div style={{ marginTop: '6px', padding: '10px', background: '#111', borderRadius: '6px', border: '1px solid #222' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>{t('dashboard.previousScore')}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#666', fontFamily: 'Space Grotesk' }}>
                          {data!.assessmentLayer.baselineComparison.previousRiskScore}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>{t('dashboard.currentScore')}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: riskColor, fontFamily: 'Space Grotesk' }}>
                          {data!.assessmentLayer.baselineComparison.currentRiskScore}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>{t('dashboard.delta')}</span>
                        <span style={{
                          fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk',
                          color: data!.assessmentLayer.baselineComparison.delta > 0 ? '#E31B23' : data!.assessmentLayer.baselineComparison.delta < 0 ? '#00D26A' : '#666',
                        }}>
                          {data!.assessmentLayer.baselineComparison.delta > 0 ? '+' : ''}{data!.assessmentLayer.baselineComparison.delta}
                          {data!.assessmentLayer.baselineComparison.anomalyLevel && (
                            <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px', fontWeight: 400 }}>
                              ({data!.assessmentLayer.baselineComparison.anomalyLevel})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {data!.assessmentLayer.classification?.rationale && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.classificationRationale')}</span>
                    <div style={{ marginTop: '6px', padding: '10px', background: '#111', borderRadius: '6px', border: '1px solid #8B5CF620', fontSize: '11px', color: '#aaa', lineHeight: 1.5 }}>
                      {data!.assessmentLayer.classification.rationale}
                      {data!.assessmentLayer.classification.indicators && data!.assessmentLayer.classification.indicators.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {data!.assessmentLayer.classification.indicators.map((ind, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10px', color: '#888' }}>
                              <span style={{ color: '#8B5CF6' }}>▸</span> {ind}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {data!.assessmentLayer.correlation?.factors && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.correlationFactors')}</span>
                    <div style={{ marginTop: '6px' }}>
                      {Object.entries(data!.assessmentLayer.correlation.factors).map(([key, value], i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', color: '#888', width: '120px', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div style={{ flex: 1, height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${(value as number) * 100}%`, height: '100%', background: (value as number) > 0.5 ? '#00D26A' : (value as number) > 0.2 ? '#FFB800' : '#E31B23', transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: '10px', color: '#666', width: '35px', textAlign: 'right' }}>
                            {((value as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data!.assessmentLayer.iocStats && (
                  <div>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.indicatorStatistics')}</span>
                    <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <div style={{ padding: '6px', background: '#111', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#E31B23', fontFamily: 'Space Grotesk' }}>{data!.assessmentLayer.iocStats.uniqueCVECount}</div>
                        <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>{t('indicators.cves')}</div>
                      </div>
                      <div style={{ padding: '6px', background: '#111', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', fontFamily: 'Space Grotesk' }}>{data!.assessmentLayer.iocStats.uniqueDomainCount}</div>
                        <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.domains')}</div>
                      </div>
                      <div style={{ padding: '6px', background: '#111', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#00D26A', fontFamily: 'Space Grotesk' }}>{data!.assessmentLayer.iocStats.totalIndicators}</div>
                        <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>{t('dashboard.total')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Recommended Actions */}
            <Section title={t('section.recommendedActions')}>
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #1a0f0f 0%, #0f0a0a 100%)',
                borderRadius: '12px', border: '1px solid #E31B2340',
                boxShadow: '0 0 30px rgba(227, 27, 35, 0.1)',
              }}>
                <div style={{ fontSize: '10px', color: '#E31B23', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('dashboard.mitigationSteps')}
                </div>
                {data!.executive.recommendedActions
                  ?.filter(action => action.length > 15 && !action.match(/^(RECOMMENDED|ACTIONS?\*)/i))
                  .map((action, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    marginBottom: '12px', padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px',
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E31B23 0%, #FF6B35 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{
                      fontSize: '12px', color: '#ccc', lineHeight: 1.5, paddingTop: '2px',
                    }}>
                      {action.replace(/^\.\s*/, '').replace(/\*\*/g, '')}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── Top Bar: Header + Tab Navigation ── */}
      <div style={{
        background: 'linear-gradient(180deg, #111 0%, #0d0d0d 100%)',
        borderBottom: '1px solid #222',
        padding: '0 32px',
        flexShrink: 0,
      }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#00D26A',
              letterSpacing: '1px',
            }}>
              {t('dashboard.threatIntelligence')}
            </div>
            <div style={{
              padding: '3px 10px',
              borderRadius: '12px',
              background: `${riskColor}20`,
              border: `1px solid ${riskColor}60`,
              color: riskColor,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              {t('status.level.' + data!.status.riskLevel)} • {data!.status.riskScore}/100
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>{t('generated')}: {new Date(data!.meta.generatedAt).toLocaleString()}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '12px',
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  background: isActive
                    ? 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid #333'
                    : '1px solid transparent',
                  borderBottom: isActive
                    ? '1px solid #0a0a0a'
                    : '1px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  color: isActive ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  bottom: '-1px',
                  marginBottom: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#aaa';
                    (e.currentTarget as HTMLButtonElement).style.background = '#ffffff08';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#666';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontSize: '14px',
                  color: isActive ? '#00D26A' : '#555',
                  transition: 'color 0.2s ease',
                }}>
                  {tab.icon}
                </span>
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel Content ── */}
      {activeTab === 'executive' && renderExecutivePanel()}
      {activeTab === 'correlation' && renderCorrelationPanel()}
      {activeTab === 'detail' && renderDetailPanel()}
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

export default CTIDashboardWithI18n;
