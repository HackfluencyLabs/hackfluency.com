/**
 * CTI Pipeline - Shared Types
 * Tipos compartidos para el sistema de agregación de inteligencia de amenazas
 */

import { z } from 'zod';

// ==================== Enums ====================

export enum ThreatSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum ThreatCategory {
  MALWARE = 'malware',
  RANSOMWARE = 'ransomware',
  PHISHING = 'phishing',
  DDoS = 'ddos',
  APT = 'apt',
  VULNERABILITY = 'vulnerability',
  DATA_BREACH = 'data_breach',
  SUPPLY_CHAIN = 'supply_chain',
  SOCIAL_ENGINEERING = 'social_engineering',
  INFRASTRUCTURE = 'infrastructure',
  OTHER = 'other'
}

export enum DataSource {
  X_COM = 'x.com',
  SHODAN = 'shodan',
  // Futuras fuentes
  MISP = 'misp',
  ALIENVAULT = 'alienvault',
  VIRUSTOTAL = 'virustotal',
  ABUSE_CH = 'abuse.ch'
}

// Países Latinoamericanos - Enfoque Regional CTI
export const LATAM_COUNTRIES = [
  'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'NI', 'SV', 'CR', 'PA', 'UY'
] as const;

export type LatamCountryCode = typeof LATAM_COUNTRIES[number];

// Mapeo de códigos a nombres de países
export const LATAM_COUNTRY_NAMES: Record<LatamCountryCode, string> = {
  MX: 'México',
  BR: 'Brasil',
  AR: 'Argentina',
  CO: 'Colombia',
  CL: 'Chile',
  PE: 'Perú',
  VE: 'Venezuela',
  EC: 'Ecuador',
  GT: 'Guatemala',
  CU: 'Cuba',
  BO: 'Bolivia',
  DO: 'República Dominicana',
  HN: 'Honduras',
  PY: 'Paraguay',
  NI: 'Nicaragua',
  SV: 'El Salvador',
  CR: 'Costa Rica',
  PA: 'Panamá',
  UY: 'Uruguay'
};

// ==================== Base Interfaces ====================

export interface BaseScrapedData {
  source: DataSource;
  timestamp: string;
  rawData: unknown;
}

export interface CacheMetadata {
  createdAt: string;
  expiresAt: string;
  source: DataSource;
  checksum: string;
}

// ==================== X.com Types ====================

export interface XCookie {
  domain: string;
  expirationDate?: number;
  hostOnly: boolean;
  httpOnly: boolean;
  name: string;
  path: string;
  sameSite: string;
  secure: boolean;
  session: boolean;
  storeId: string;
  value: string;
}

export interface XCookiesFile {
  url: string;
  cookies: XCookie[];
}

export interface XPost {
  id: string;
  text: string;
  author: {
    username: string;
    displayName: string;
    verified: boolean;
  };
  metrics: {
    likes: number;
    reposts: number;
    replies: number;
    views: number;
  };
  timestamp: string;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
  }[];
  permalink?: string; // Direct link to the original tweet for evidence
}

export interface XScrapedData extends BaseScrapedData {
  source: DataSource.X_COM;
  posts: XPost[];
  searchQuery: string;
}

// ==================== Shodan Types ====================

export interface ShodanHost {
  ip: string;
  port: number;
  hostnames: string[];
  org?: string;
  asn?: string;
  isp?: string;
  country: string;
  city?: string;
  os?: string;
  product?: string;
  version?: string;
  vulns?: string[];
  tags?: string[];
  lastUpdate: string;
}

export interface ShodanExploit {
  id: string;
  cve?: string;
  description: string;
  platform?: string;
  type?: string;
  source: string;
}

export interface ShodanScrapedData extends BaseScrapedData {
  source: DataSource.SHODAN;
  hosts: ShodanHost[];
  exploits: ShodanExploit[];
  query: string;
}

// ==================== Processed Data Types ====================

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'cve' | 'keyword';
  value: string;
  confidence: number; // 0-100
  sources: DataSource[];
  firstSeen: string;
  lastSeen: string;
  context?: string;
}

export interface ProcessedThreat {
  id: string;
  title: string;
  description: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  indicators: ThreatIndicator[];
  sources: DataSource[];
  socialContext?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    engagement: number;
    keyPhrases: string[];
    influencers: string[];
  };
  technicalContext?: {
    affectedSystems: string[];
    attackVectors: string[];
    mitigations: string[];
  };
  timestamp: string;
  confidence: number;
}

export interface ProcessedData {
  threats: ProcessedThreat[];
  indicators: ThreatIndicator[];
  correlation: CorrelatedData;
  summary: {
    totalThreats: number;
    bySeverity: Record<ThreatSeverity, number>;
    byCategory: Record<ThreatCategory, number>;
    bySource: Record<DataSource, number>;
  };
  processingTimestamp: string;
}

// ==================== LLM Types ====================

export interface LLMAnalysisRequest {
  threats: ProcessedThreat[];
  contextWindow: 'short' | 'medium' | 'long';
  focusAreas?: ThreatCategory[];
}

export interface LLMInsight {
  id: string;
  type: 'trend' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  content: string;
  confidence: number;
  relatedThreats: string[]; // IDs de ProcessedThreat
  metadata?: Record<string, unknown>;
}

export interface LLMAnalysisResult {
  insights: LLMInsight[];
  executiveSummary: string;
  technicalSummary: string;
  recommendations: string[];
  trendingTopics: Array<{
    topic: string;
    growth: number; // Porcentaje
    relevance: number;
  }>;
  analysisTimestamp: string;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

// ==================== New CTI Architecture Output ====================

/**
 * New minimal CTI dashboard output following Signal/Assessment separation
 * Aligned with reference document architecture
 */
export interface MinimalCTIReport {
  signals: SignalLayer;
  assessment: AssessmentLayer;
  ctiAnalysis: {
    generatedAt: string;
    validUntil: string;
    modelsUsed: ModelMetadata;
    version: string;
  };
}

// ==================== Dashboard Types ====================

export interface DashboardWidget {
  id: string;
  type: 'threat-feed' | 'severity-chart' | 'trend-graph' | 'map' | 'timeline' | 'insights';
  title: string;
  data: unknown;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CTIDashboard {
  version: string;
  generatedAt: string;
  dataRange: {
    start: string;
    end: string;
  };
  summary: ProcessedData['summary'];
  topThreats: ProcessedThreat[];
  recentIndicators: ThreatIndicator[];
  llmAnalysis: LLMAnalysisResult;
  widgets: DashboardWidget[];
  metadata: {
    sourcesUsed: DataSource[];
    cacheHits: number;
    processingTimeMs: number;
  };
  // New fields from minimal architecture
  signalLayer?: SignalLayer;
  assessmentLayer?: AssessmentLayer;
  modelMetadata?: ModelMetadata;
}

// ==================== Evidence & Source Links ====================

/**
 * Evidence link to original source
 * Allows users to verify and explore threat data
 */
export interface EvidenceLink {
  source: DataSource;
  type: 'post' | 'host' | 'exploit' | 'feed' | 'search';
  title: string;
  url: string;
  timestamp: string;
  excerpt?: string;
  metadata?: {
    author?: string;
    engagement?: number;
    port?: number;
    ip?: string;
  };
}

/**
 * Observable indicator with evidence
 */
export interface ObservableWithEvidence {
  type: 'ip' | 'port' | 'domain' | 'cve' | 'hash' | 'keyword';
  value: string;
  context: string;
  evidence: EvidenceLink[];
  severity: ThreatSeverity;
  confidence: number;
}

// ==================== Signal Layer Types (Immutable) ====================

/**
 * Signal Layer - Raw and structured extraction only
 * Immutable, preserves original data for reassessment without re-collecting
 */
export interface SignalLayer {
  raw: {
    xPosts: XPost[];
    shodanResults: ShodanHost[];
  };
  structured: StructuredSignals;
}

export interface StructuredSignals {
  extractedCVEs: string[];
  domains: string[];
  ips: string[];
  ports: number[];
  services: string[];
  keywords: string[];
  exploitationClaims: string[];
  tone: 'speculative' | 'confirmed' | 'mixed';
  topPosts: Array<{
    author: string;
    excerpt: string;
    engagement: number;
    url?: string;
    timestamp: string;
  }>;
}

// ==================== Assessment Layer Types (Reprocessable) ====================

/**
 * Assessment Layer - Operates strictly on signals.structured
 * Can be regenerated without re-collecting raw data
 */
export interface AssessmentLayer {
  correlation: QuantifiedCorrelation;
  scoring: RiskComputation;
  baselineComparison: BaselineComparison;
  freshness: DataFreshness;
  classification: ThreatClassification;
  iocStats: IndicatorStatistics;
  narrative: string;
}

/**
 * Quantified Correlation Model - Numerical structure for reproducibility
 */
export interface QuantifiedCorrelation {
  score: number; // 0.0 - 1.0
  strength: 'weak' | 'moderate' | 'strong';
  factors: {
    cveOverlap: number; // 0.0 - 1.0
    serviceMatch: number; // 0.0 - 1.0
    temporalProximity: number; // 0.0 - 1.0
    infraSocialAlignment: number; // 0.0 - 1.0
  };
  explanation: string;
}

/**
 * Baseline Comparison - Quantitative trend tracking
 */
export interface BaselineComparison {
  previousRiskScore: number;
  currentRiskScore: number;
  delta: number; // Positive = increased risk
  anomalyLevel: 'stable' | 'mild' | 'moderate' | 'severe';
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Data Freshness Score - Critical for CTI validity
 */
export interface DataFreshness {
  socialAgeHours: number;
  infraAgeHours: number;
  freshnessScore: number; // 0.0 - 1.0
  status: 'high' | 'moderate' | 'stale';
}

/**
 * Indicator Statistics - Anti-inflation control
 */
export interface IndicatorStatistics {
  uniqueCVECount: number;
  uniqueDomainCount: number;
  uniqueIPCount: number;
  uniquePortCount: number;
  uniqueServiceCount: number;
  totalIndicators: number;
  duplicates: number;
  duplicationRatio: number; // duplicates / totalIndicators
}

/**
 * Risk Computation - Transparent and auditable scoring
 */
export interface RiskComputation {
  weights: {
    vulnerabilityRatio: number;
    socialIntensity: number;
    correlationScore: number;
    freshnessScore: number;
    baselineDelta: number;
  };
  components: {
    vulnerabilityRatio: number; // 0.0 - 1.0
    socialIntensity: number; // 0.0 - 1.0
    correlationScore: number; // 0.0 - 1.0
    freshnessScore: number; // 0.0 - 1.0
    baselineDelta: number; // Normalized delta impact
  };
  computedScore: number; // 0 - 100
  confidenceLevel: number; // 0 - 100
}

/**
 * Threat Classification - Formalized threat type
 */
export interface ThreatClassification {
  type: 'opportunistic' | 'targeted' | 'campaign';
  confidence: number; // 0 - 100
  rationale: string;
  indicators: string[];
}

/**
 * Model Metadata - For benchmarking and credibility
 */
export interface ModelMetadata {
  strategic: string;
  technical: string;
  quantization?: string;
  version?: string;
}

// ==================== Correlation Types ====================

/**
 * Señales correlacionables entre fuentes
 * Links infrastructure signals (Shodan) with social context (X.com)
 * @deprecated Use QuantifiedCorrelation instead
 */
export interface CorrelationSignal {
  id: string;
  type: 'port' | 'service' | 'keyword' | 'protocol' | 'country';
  value: string;
  label: string; // Human readable: "SSH", "RDP", "ransomware"
  sources: Array<{
    source: DataSource;
    count: number;
    firstSeen: string;
    lastSeen: string;
    sampleData?: string[]; // IPs, posts excerpts, etc
    evidence?: EvidenceLink[]; // Links to original sources
  }>;
  temporalAnalysis?: {
    infraPrecedesSocial: boolean;
    timeDeltaHours: number;
    pattern: 'scanning' | 'exploitation' | 'discussion' | 'unknown';
  };
  correlationInsight?: string; // AI-generated insight about this correlation
}

export interface TemporalCorrelation {
  signal: string;
  infraTimestamp: string | null;
  socialTimestamp: string | null;
  deltahours: number | null;
  interpretation: string;
  evidence: {
    infra?: EvidenceLink[];
    social?: EvidenceLink[];
  };
}

export interface CorrelatedData {
  signals: CorrelationSignal[];
  temporalCorrelations: TemporalCorrelation[];
  summary: {
    totalSignals: number;
    infraOnlySignals: number;
    socialOnlySignals: number;
    correlatedSignals: number;
    avgTimeDelta: number | null;
  };
  dominantPattern: 'infra-first' | 'social-first' | 'simultaneous' | 'insufficient-data';
  executiveInsight?: string; // High-level correlation summary for executives
}

// ==================== Scraper Configuration ====================

export interface ScraperConfig {
  source: DataSource;
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    cooldownMs: number;
  };
  cache: {
    enabled: boolean;
    ttlHours: number;
  };
  queries: string[];
}

export interface PipelineConfig {
  scrapers: ScraperConfig[];
  llm: {
    provider: 'openai' | 'anthropic';
    model: string;
    maxTokens: number;
    temperature: number;
  };
  output: {
    dashboardPath: string;
    cachePath: string;
    artifactsPath: string;
  };
}

// ==================== Zod Schemas for Validation ====================

export const ThreatIndicatorSchema = z.object({
  id: z.string(),
  type: z.enum(['ip', 'domain', 'hash', 'url', 'cve', 'keyword']),
  value: z.string(),
  confidence: z.number().min(0).max(100),
  sources: z.array(z.nativeEnum(DataSource)),
  firstSeen: z.string().datetime(),
  lastSeen: z.string().datetime(),
  context: z.string().optional()
});

export const ProcessedThreatSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.nativeEnum(ThreatCategory),
  severity: z.nativeEnum(ThreatSeverity),
  indicators: z.array(ThreatIndicatorSchema),
  sources: z.array(z.nativeEnum(DataSource)),
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(100)
});

// ==================== Utility Types ====================

export type ScraperResult<T extends BaseScrapedData> = {
  success: true;
  data: T;
  fromCache: boolean;
} | {
  success: false;
  error: string;
  fromCache: false;
};

export type ProcessorResult = {
  success: true;
  data: ProcessedData;
} | {
  success: false;
  error: string;
};

export type LLMResult = {
  success: true;
  data: LLMAnalysisResult;
} | {
  success: false;
  error: string;
};
