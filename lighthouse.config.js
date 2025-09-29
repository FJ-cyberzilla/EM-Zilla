// Lighthouse configuration
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run serve:secure',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
        'categories:pwa': ['error', { minScore: 0.90 }],
        'service-worker': ['error', { minScore: 1 }],
        'viewport': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
};
