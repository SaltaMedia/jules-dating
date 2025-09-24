module.exports = {
  enabled: process.env.FEATURE_ANALYTICS === 'true',
  dryRun: process.env.ANALYTICS_DRY_RUN === 'true',
  sampleMap: JSON.parse(process.env.ANALYTICS_SAMPLE_MAP || '{}'),
  schemaVersion: process.env.ANALYTICS_SCHEMA_VERSION || '2025-08-29.v1',
  env: process.env.NODE_ENV || 'development'
};
