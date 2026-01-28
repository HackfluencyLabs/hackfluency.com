module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        // Disable throttling for CI environment
        throttlingMethod: 'simulate',
        // Skip some audits that don't apply to CI
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      assertions: {
        // Only use category-level assertions
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        // Disable individual audit assertions
        'heading-order': 'off',
        'image-redundant-alt': 'off',
        'link-text': 'off',
        'robots-txt': 'off',
        'target-size': 'off',
        'unsized-images': 'off',
        'network-dependency-tree-insight': 'off',
        'cache-insight': 'off',
        'render-blocking-insight': 'off',
        'render-blocking-resources': 'off',
        'uses-long-cache-ttl': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
