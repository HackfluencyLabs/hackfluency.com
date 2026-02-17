import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Header & General
    'app.title': 'Threat Intelligence Dashboard',
    'app.subtitle': 'Real-time Cybersecurity Analysis',
    'language': 'Language',
    'language.en': 'English',
    'language.es': 'Español',
    
    // Tabs
    'tab.executive': 'Executive Summary',
    'tab.correlation': 'Correlation Topology',
    'tab.detail': 'Full Detail',
    
    // Status
    'status.risk': 'Risk',
    'status.score': 'Score',
    'status.trend': 'Trend',
    'status.confidence': 'Confidence',
    'status.level.critical': 'Critical',
    'status.level.elevated': 'Elevated',
    'status.level.moderate': 'Moderate',
    'status.level.low': 'Low',
    'status.trend.increasing': 'Increasing',
    'status.trend.stable': 'Stable',
    'status.trend.decreasing': 'Decreasing',
    
    // Metrics
    'metrics.totalSignals': 'Total Signals',
    'metrics.critical': 'Critical',
    'metrics.high': 'High',
    'metrics.medium': 'Medium',
    'metrics.low': 'Low',
    'metrics.categories': 'Categories',
    
    // Executive
    'executive.headline': 'Headline',
    'executive.summary': 'Summary',
    'executive.keyFindings': 'Key Findings',
    'executive.recommendedActions': 'Recommended Actions',
    
    // Infrastructure
    'infra.totalHosts': 'Total Hosts',
    'infra.exposedPorts': 'Exposed Ports',
    'infra.vulnerableHosts': 'Vulnerable Hosts',
    'infra.topCountries': 'Top Countries',
    'infra.sampleHosts': 'Sample Hosts',
    
    // Indicators
    'indicators.cves': 'CVEs',
    'indicators.domains': 'Domains',
    'indicators.ips': 'IPs',
    'indicators.keywords': 'Keywords',
    
    // Timeline
    'timeline.title': 'Timeline',
    'timeline.noEvents': 'No recent events',
    
    // Sources
    'sources.title': 'Sources',
    'sources.lastUpdate': 'Last Update',
    'sources.signalCount': 'Signal Count',
    
    // CTI Analysis
    'cti.model': 'Analysis Model',
    'cti.killChain': 'Kill Chain Phase',
    'cti.threatLandscape': 'Threat Landscape',
    'cti.correlationStrength': 'Correlation Strength',
    'cti.analystBrief': 'Analyst Brief',
    'cti.methodologies': 'Methodologies',
    
    // Social Intel
    'social.totalPosts': 'Total Posts',
    'social.themes': 'Themes',
    'social.tone': 'Tone',
    'social.topPosts': 'Top Posts',
    
    // Assessment
    'assessment.correlation': 'Correlation',
    'assessment.scoring': 'Scoring',
    'assessment.baseline': 'Baseline Comparison',
    'assessment.freshness': 'Data Freshness',
    'assessment.classification': 'Classification',
    'assessment.iocStats': 'IOC Statistics',
    
    // Misc
    'loading': 'Loading...',
    'loading.initializing': 'INITIALIZING CTI',
    'error': 'Error',
    'error.unavailable': 'Intelligence data currently unavailable',
    'error.dataUnavailable': 'Data unavailable',
    'noData': 'No data available',
    'generated': 'Generated',
    'validUntil': 'Valid Until',
    'version': 'Version',
    'backToTop': 'Back to Top',
    'expand': 'Expand',
    'collapse': 'Collapse',
    'viewSource': 'View Source',
    'copy': 'Copy',
    'copied': 'Copied!',
    
    // Dashboard specific
    'dashboard.correlatedWith': 'Correlated with',
    'dashboard.sources': 'Sources',
    'dashboard.intelligenceNarrative': 'Intelligence Narrative',
    'dashboard.keyFindings': 'Key Findings',
    'dashboard.signalBreakdown': 'Signal Breakdown',
    'dashboard.recommendedActions': 'Recommended Actions',
    'dashboard.mitigationSteps': 'Mitigation Steps',
    'dashboard.threatCategories': 'Threat Categories',
    'dashboard.domains': 'Domains',
    'dashboard.totalIocs': 'Total IOCs',
    'dashboard.exposedPorts': 'Exposed Ports',
    'dashboard.topCountries': 'Top Countries',
    'dashboard.vulnerableHostsSample': 'Vulnerable Hosts (Sample)',
    'dashboard.baselineComparison': 'Baseline Comparison',
    'dashboard.previousScore': 'Previous Score',
    'dashboard.currentScore': 'Current Score',
    'dashboard.delta': 'Delta',
    'dashboard.classificationRationale': 'Classification Rationale',
    'dashboard.correlationFactors': 'Correlation Factors',
    'dashboard.indicatorStatistics': 'Indicator Statistics',
    'dashboard.hosts': 'Hosts',
    'dashboard.vulnerable': 'Vulnerable',
    'dashboard.vuln': '% Vuln',
    'dashboard.threatIntelligence': 'THREAT INTELLIGENCE',
    'dashboard.correlation': 'correlation',
    'dashboard.noExplanation': 'No explanation available',
    'dashboard.correlationStrength': 'Fortaleza de Correlación',
    
    // Additional hardcoded strings found in component
    'dashboard.computedScore': 'Computed Score',
    'dashboard.confidenceLevel': 'Confidence Level',
    'dashboard.crossSourceDuplication': 'Cross-source duplication',
    'dashboard.socialDataAge': 'Social data age',
    'dashboard.infrastructureAge': 'Infrastructure age',
    'dashboard.crossSourceMatch': 'Cross-source match',
    'dashboard.noMatchFound': 'No match found',
    'dashboard.socialOnly': 'Social only',
    'dashboard.noMatch': 'No match',
    'dashboard.mentionedInPosts': 'Mentioned in posts',
    'dashboard.foundInScans': 'Found in scans',
    'dashboard.cveOverlap': 'CVE Overlap',
    'dashboard.factor.cveOverlap.desc': 'Degree of CVE overlap between social mentions and infrastructure',
    'dashboard.serviceMatch': 'Service Match',
    'dashboard.factor.serviceMatch.desc': 'Similarity of exposed services between data sources',
    'dashboard.temporalProximity': 'Temporal Proximity',
    'dashboard.factor.temporalProximity.desc': 'Time correlation between social and infrastructure data',
    'dashboard.infraSocialAlignment': 'Infra-Social Alignment',
    'dashboard.factor.infraSocialAlignment.desc': 'Overall alignment between infrastructure and social indicators',
    'dashboard.analysisMethods': 'Analysis Methods',
    'dashboard.modelsUsed': 'Models Used',
    'dashboard.strategic': 'Strategic',
    'dashboard.technical': 'Technical',
    'dashboard.quantization': 'Quantization',
    'dashboard.shodan': 'Shodan',
    'dashboard.killChain': 'Kill chain',
    'dashboard.killChainModel': 'Kill Chain Model',
    'dashboard.killChainLegend': 'Kill Chain Phase',
    'dashboard.score': 'Score',
    'dashboard.total': 'Total',
    'dashboard.truncated': 'Output truncated — the AI model reached its token limit. Run the pipeline again with a higher num_predict value for a complete analysis.',
    'dashboard.socialIntel': 'Social Intel',
    'dashboard.infrastructure': 'Infrastructure',
    'dashboard.themes': 'Themes',
    'dashboard.tone': 'Tone',
    'dashboard.topPosts': 'Top Posts',
    'dashboard.engagement': 'engagement',
    'dashboard.analyzingThreatIndicators': '> ANALYZING THREAT INDICATORS...',
    'dashboard.technicalAssessment': 'Technical Assessment',
    
    // Risk Scale Tooltip
    'dashboard.riskScale': 'Risk Scale',
    'dashboard.riskScale.low': 'Low: 0-25',
    'dashboard.riskScale.moderate': 'Moderate: 26-50',
    'dashboard.riskScale.elevated': 'Elevated: 51-75',
    'dashboard.riskScale.critical': 'Critical: 76-100',
    
    // Trend Tooltip
    'dashboard.trendTooltip': 'Comparación Histórica',
    'dashboard.trendTooltip.previous': 'Anterior',
    'dashboard.trendTooltip.current': 'Actual',
    
    // Classification Types
    'classification.type.targeted': 'targeted',
    'classification.type.opportunistic': 'opportunistic',
    'classification.type.campaign': 'campaign',
    'classification.type.unknown': 'unknown',
    
    // Correlation Strength
    'correlation.strength.weak': 'weak',
    'correlation.strength.moderate': 'moderate',
    'correlation.strength.strong': 'strong',
    
    // Freshness Tooltips
    'dashboard.socialAgeTooltip': 'Time since the last social media post was collected',
    'dashboard.infraAgeTooltip': 'Time since the last Shodan scan data was collected',
    
    // Scoring weights/keys
    'scoring.vulnerabilityRatio': 'Vulnerability Ratio',
    'scoring.socialSignals': 'Social Signals',
    'scoring.infrastructureExposure': 'Infrastructure Exposure',
    'scoring.cveSeverity': 'CVE Severity',
    'scoring.campaignAlignment': 'Campaign Alignment',
    'scoring.dataFreshness': 'Data Freshness',
    'scoring.socialIntensity': 'Social Intensity',
    'scoring.correlationScore': 'Correlation Score',
    'scoring.freshnessScore': 'Freshness Score',
    'scoring.baselineDelta': 'Baseline Delta',
    'dashboard.listed': 'listed',
    'dashboard.correlationMapTitle': 'DATA-SOURCE CORRELATION MAP',
    'dashboard.correlationMapLegend': 'Edges represent verified data relationships • Dashed = weak/no evidence',
    
    // Node labels
    'node.socialIntel': 'SOCIAL\nINTEL',
    'node.infraScan': 'INFRA\nSCAN',
    'node.correlation': 'CORRELATION',
    'node.source': 'Source',
    'node.posts': 'Posts',
    'node.tone': 'Tone',
    'node.themes': 'Themes',
    'node.totalHosts': 'Total Hosts',
    'node.vulnerable': 'Vulnerable',
    'node.exposure': 'Exposure',
    'node.cve': 'CVE',
    'node.shodanInfra': 'Shodan Infrastructure',
    'node.foundIn': 'Found in',
    'node.vulnerableHosts': 'Vulnerable hosts',
    'node.socialIntelOnly': 'Social Intel ONLY',
    'node.notFoundInfra': 'NOT found in infrastructure scans',
    'node.noCrossValidation': 'No cross-source validation',
    'node.theme': 'Theme',
    'node.socialIntelligence': 'Social Intelligence',
    'node.extractedFrom': 'Extracted from X.com discussions',
    'node.na': 'N/A',
    
    // Section titles
    'section.executiveSummary': 'EXECUTIVE SUMMARY',
    'section.threatAnalysis': 'THREAT ANALYSIS',
    'section.socialIntelligence': 'SOCIAL INTELLIGENCE',
    'section.methodology': 'METHODOLOGY',
    'section.dataSources': 'DATA SOURCES',
    'section.indicators': 'INDICATORS',
    'section.infrastructure': 'INFRASTRUCTURE',
    'section.assessmentDetails': 'ASSESSMENT DETAILS',
    'section.recommendedActions': 'RECOMMENDED ACTIONS',
    
    // Missing translations
    'dashboard.noTechnicalAssessment': 'No technical assessment available',
    'dashboard.analysisComplete': '> ANALYSIS COMPLETE',
    'social.viewOnX': 'View on X',
    'dashboard.dataFreshness': 'Data Freshness',
    'dashboard.nodeTypes': 'Node Types',
    'dashboard.edgeMeaning': 'Edge Meaning',
  },
  es: {
    // Header & General
    'app.title': 'Panel de Inteligencia de Amenazas',
    'app.subtitle': 'Análisis de Ciberseguridad en Tiempo Real',
    'language': 'Idioma',
    'language.en': 'English',
    'language.es': 'Español',
    
    // Tabs
    'tab.executive': 'Resumen Ejecutivo',
    'tab.correlation': 'Topología de Correlación',
    'tab.detail': 'Detalles Completos',
    
    // Status
    'status.risk': 'Riesgo',
    'status.score': 'Puntuación',
    'status.trend': 'Tendencia',
    'status.confidence': 'Confianza',
    'status.level.critical': 'Crítico',
    'status.level.elevated': 'Elevado',
    'status.level.moderate': 'Moderado',
    'status.level.low': 'Bajo',
    'status.trend.increasing': 'Ascendente',
    'status.trend.stable': 'Estable',
    'status.trend.decreasing': 'Descendente',
    
    // Metrics
    'metrics.totalSignals': 'Señales Totales',
    'metrics.critical': 'Crítico',
    'metrics.high': 'Alto',
    'metrics.medium': 'Medio',
    'metrics.low': 'Bajo',
    'metrics.categories': 'Categorías',
    
    // Executive
    'executive.headline': 'Titular',
    'executive.summary': 'Resumen',
    'executive.keyFindings': 'Hallazgos Clave',
    'executive.recommendedActions': 'Acciones Recomendadas',
    
    // Infrastructure
    'infra.totalHosts': 'Total de Hosts',
    'infra.exposedPorts': 'Puertos Expuestos',
    'infra.vulnerableHosts': 'Hosts Vulnerables',
    'infra.topCountries': 'Principales Países',
    
    // Indicators
    'indicators.cves': 'CVEs',
    'indicators.domains': 'Dominios',
    'indicators.ips': 'IPs',
    'indicators.keywords': 'Palabras Clave',
    
    // Timeline
    'timeline.title': 'Línea de Tiempo',
    'timeline.noEvents': 'Sin eventos recientes',
    
    // Sources
    'sources.title': 'Fuentes',
    'sources.lastUpdate': 'Última Actualización',
    'sources.signalCount': 'Cantidad de Señales',
    
    // CTI Analysis
    'cti.model': 'Modelo de Análisis',
    'cti.killChain': 'Fase de Kill Chain',
    'cti.threatLandscape': 'Panorama de Amenazas',
    'cti.correlationStrength': 'Fortaleza de Correlación',
    'cti.analystBrief': 'Informe del Analista',
    'cti.methodologies': 'Metodologías',
    
    // Social Intel
    'social.totalPosts': 'Total de Publicaciones',
    'social.themes': 'Temas',
    'social.tone': 'Tono',
    'social.topPosts': 'Principales Publicaciones',
    
    // Assessment
    'assessment.correlation': 'Correlación',
    'assessment.scoring': 'Puntuación',
    'assessment.baseline': 'Comparación Base',
    'assessment.freshness': 'Frescura de Datos',
    'assessment.classification': 'Clasificación',
    'assessment.iocStats': 'Estadísticas IOC',
    
    // Misc
    'loading': 'Cargando...',
    'loading.initializing': 'INICIALIZANDO CTI',
    'error': 'Error',
    'error.unavailable': 'Datos de inteligencia no disponibles',
    'error.dataUnavailable': 'Datos no disponibles',
    'noData': 'Sin datos disponibles',
    'generated': 'Generado',
    'validUntil': 'Válido Hasta',
    'version': 'Versión',
    'backToTop': 'Volver Arriba',
    'expand': 'Expandir',
    'collapse': 'Colapsar',
    'viewSource': 'Ver Fuente',
    'copy': 'Copiar',
    'copied': '¡Copiado!',
    
    // Dashboard specific
    'dashboard.correlatedWith': 'Correlacionado con',
    'dashboard.sources': 'Fuentes',
    'dashboard.intelligenceNarrative': 'Narrativa de Inteligencia',
    'dashboard.keyFindings': 'Hallazgos Clave',
    'dashboard.signalBreakdown': 'Desglose de Señales',
    'dashboard.recommendedActions': 'Acciones Recomendadas',
    'dashboard.mitigationSteps': 'Pasos de Mitigación',
    'dashboard.threatCategories': 'Categorías de Amenazas',
    'dashboard.domains': 'Dominios',
    'dashboard.totalIocs': 'Total IOCs',
    'dashboard.exposedPorts': 'Puertos Expuestos',
    'dashboard.topCountries': 'Principales Países',
    'dashboard.vulnerableHostsSample': 'Hosts Vulnerables (Muestra)',
    'dashboard.baselineComparison': 'Comparación Base',
    'dashboard.previousScore': 'Puntuación Anterior',
    'dashboard.currentScore': 'Puntuación Actual',
    'dashboard.delta': 'Delta',
    'dashboard.classificationRationale': 'Rationalización de Clasificación',
    'dashboard.correlationFactors': 'Factores de Correlación',
    'dashboard.indicatorStatistics': 'Estadísticas de Indicadores',
    'dashboard.hosts': 'Hosts',
    'dashboard.vulnerable': 'Vulnerables',
    'dashboard.vuln': '% Vuln',
    'dashboard.threatIntelligence': 'INTELIGENCIA DE AMENAZAS',
    'dashboard.correlation': 'correlación',
    'dashboard.noExplanation': 'Sin explicación disponible',
    'dashboard.correlationStrength': 'Fortaleza de Correlación',
    'dashboard.analyzingThreatIndicators': '> ANALIZANDO INDICADORES DE AMENAZAS...',
    'dashboard.technicalAssessment': 'Evaluación Técnica',
    'dashboard.modelsUsed': 'Modelos Utilizados',
    'dashboard.strategic': 'Estratégico',
    'dashboard.technical': 'Técnico',
    'dashboard.quantization': 'Cuantización',
    'dashboard.engagement': 'interacciones',
    
    // Risk Scale
    'dashboard.riskScale': 'Escala de Riesgo',
    'dashboard.riskScale.low': 'Bajo: 0-25',
    'dashboard.riskScale.moderate': 'Moderado: 26-50',
    'dashboard.riskScale.elevated': 'Elevado: 51-75',
    'dashboard.riskScale.critical': 'Crítico: 76-100',
    
    // Trend Tooltip
    'dashboard.trendTooltip': 'Comparación Histórica',
    'dashboard.trendTooltip.previous': 'Anterior',
    'dashboard.trendTooltip.current': 'Actual',
    
    // Additional hardcoded strings found in component
    'dashboard.computedScore': 'Puntuación Calculada',
    'dashboard.riskScoreComputation': 'Cálculo de Puntuación de Riesgo',
    'dashboard.confidenceLevel': 'Nivel de Confianza',
    'dashboard.socialDataAge': 'Edad de datos sociales',
    'dashboard.infrastructureAge': 'Edad de datos de infraestructura',
    
    // Scoring weights/keys
    'scoring.vulnerabilityRatio': 'Ratio de Vulnerabilidad',
    'scoring.socialSignals': 'Señales Sociales',
    'scoring.infrastructureExposure': 'Exposición de Infraestructura',
    'scoring.cveSeverity': 'Severidad de CVE',
    'scoring.campaignAlignment': 'Alineación de Campaña',
    'scoring.dataFreshness': 'Frescura de Datos',
    'scoring.socialIntensity': 'Intensidad Social',
    'scoring.correlationScore': 'Puntuación de Correlación',
    'scoring.freshnessScore': 'Puntuación de Frescura',
    'scoring.baselineDelta': 'Delta de Línea Base',
    'dashboard.listed': 'listados',
    'dashboard.correlationMapTitle': 'MAPA DE CORRELACIÓN DE FUENTES DE DATOS',
    'dashboard.correlationMapLegend': 'Las aristas representan relaciones de datos verificadas • Discontinua = evidencia débil/inexistente',
    
    // Correlation strength
    'correlation.strength.weak': 'débil',
    'correlation.strength.moderate': 'moderada',
    'correlation.strength.strong': 'fuerte',
    
    // Classification types
    'classification.type.targeted': 'dirigido',
    'classification.type.opportunistic': 'oportunista',
    'classification.type.campaign': 'campaña',
    'classification.type.unknown': 'desconocido',
    
    // Factor descriptions
    'dashboard.factor.cveOverlap.desc': 'Grado de superposición de CVE entre menciones sociales e infraestructura',
    'dashboard.factor.serviceMatch.desc': 'Similitud de servicios expuestos entre fuentes de datos',
    'dashboard.factor.temporalProximity.desc': 'Correlación temporal entre datos sociales e infraestructura',
    'dashboard.factor.infraSocialAlignment.desc': 'Alineación general entre indicadores de infraestructura y sociales',
    
    // Node labels
    'node.socialIntel': 'INTEL\nSOCIAL',
    'node.infraScan': 'ESCANEO\nINFRA',
    'node.correlation': 'CORRELACIÓN',
    'node.source': 'Fuente',
    'node.posts': 'Publicaciones',
    'node.tone': 'Tono',
    'node.themes': 'Temas',
    'node.totalHosts': 'Total Hosts',
    'node.vulnerable': 'Vulnerables',
    'node.exposure': 'Exposición',
    'node.cve': 'CVE',
    'node.shodanInfra': 'Infraestructura Shodan',
    'node.foundIn': 'Encontrado en',
    'node.vulnerableHosts': 'hosts vulnerables',
    'node.socialIntelOnly': 'SOLO Inteligencia Social',
    'node.notFoundInfra': 'NO encontrado en escaneos de infraestructura',
    'node.noCrossValidation': 'Sin validación cruzada',
    'node.theme': 'Tema',
    'node.socialIntelligence': 'Inteligencia Social',
    'node.extractedFrom': 'Extraído de discusiones en X.com',
    'node.na': 'N/D',
    
    // Section titles
    'section.executiveSummary': 'RESUMEN EJECUTIVO',
    'section.threatAnalysis': 'ANÁLISIS DE AMENAZAS',
    'section.socialIntelligence': 'INTELIGENCIA SOCIAL',
    'section.methodology': 'METODOLOGÍA',
    'section.dataSources': 'FUENTES DE DATOS',
    'section.indicators': 'INDICADORES',
    'section.infrastructure': 'INFRAESTRUCTURA',
    'section.assessmentDetails': 'DETALLES DE EVALUACIÓN',
    'section.recommendedActions': 'ACCIONES RECOMENDADAS',
    
    // Missing translations
    'dashboard.noTechnicalAssessment': 'Sin evaluación técnica disponible',
    'dashboard.analysisComplete': '> ANÁLISIS COMPLETO',
    'social.viewOnX': 'Ver en X',
    'dashboard.dataFreshness': 'Frescura de Datos',
    'dashboard.nodeTypes': 'Tipos de Nodos',
    'dashboard.edgeMeaning': 'Significado de Enlaces',
    'infra.totalScanned': 'TOTAL: {count} hosts escaneados',
    'infra.vulnerable': 'VULNERABLES: {count} hosts ({percentage}%)',
    'infra.byCountry': 'POR PAÍS:',
    'infra.byService': 'POR SERVICIO:',
    'infra.topCVEs': 'PRINCIPALES CVEs (de {count} hosts de muestra):',
    'infra.sampleHosts': 'HOSTS DE MUESTRA ({count} de {total} vulnerables):',
    'infra.hosts': 'hosts',
    'infra.cves': 'CVEs',
    'dashboard.killChain': 'Cadena de Muerte',
    'dashboard.killChainModel': 'Modelo de Cadena de Muerte',
    'dashboard.killChainLegend': 'Fase de la cadena de muerte',
    'dashboard.crossSourceDuplication': 'Duplicación entre fuentes',
    'dashboard.crossSourceMatch': 'Coincidencia entre fuentes',
    'dashboard.noMatchFound': 'Sin coincidencia',
    'dashboard.socialOnly': 'Solo social',
    'dashboard.noMatch': 'Sin coincidencia',
    'dashboard.cveOverlap': 'Superposición de CVE',
    'dashboard.serviceMatch': 'Coincidencia de Servicios',
    'dashboard.temporalProximity': 'Proximidad Temporal',
    'dashboard.infraSocialAlignment': 'Alineación Infra-Social',
    'dashboard.analysisMethods': 'Métodos de Análisis',
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cti-language');
      if (saved === 'en' || saved === 'es') return saved;
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) return 'es';
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cti-language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', opacity: 0.7 }}>{t('language')}:</span>
      <button
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '6px',
          padding: '4px 10px',
          color: '#fff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        <span>{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
        <span>{language === 'en' ? 'EN' : 'ES'}</span>
      </button>
    </div>
  );
};

export default { I18nProvider, useI18n, LanguageSwitcher };
