const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { enabled, dryRun, schemaVersion, env, sampleMap } = require('../config/analyticsConfig');
const LOG_PATH = path.join(process.cwd(), 'analytics.dryrun.log');
const sha256 = v => crypto.createHash('sha256').update(String(v)).digest('hex');

function scrub(obj) {
  const clone = JSON.parse(JSON.stringify(obj || {}));
  
  // List of fields that should NOT be scrubbed (analytics metadata)
  const preservedFields = [
    'event_name', 'event_ts', 'schema_version', 'env', 'session_id', 'user_id',
    'page', 'source', 'timestamp', 'start_time', 'end_time', 'duration_ms',
    'author', 'content_type', 'tokens_estimate_bucket', 'message_length', 'has_products',
    'product_title', 'product_price', 'product_brand', 'product_link',
    'fit_check_rating', 'event_context', 'has_specific_question', 'fit_check_type',
    'item_id', 'has_brand', 'has_tags', 'cta_type', 'completed_steps',
    'time_to_complete_ms', 'profile_fields_completed_pct', 'persona_archetype',
    'num_images', 'image_quality_bucket', 'capture_method', 'category', 'brand_known',
    'error_message', 'error_stack', 'error_name', 'filename', 'lineno', 'colno', 'type'
  ];
  
  const walk = o => {
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v == null) continue;
      
      // Skip scrubbing for preserved analytics fields
      if (preservedFields.includes(k)) continue;
      
      if (typeof v === 'string') {
        // Hash phone numbers
        if (/\+?\d[\d\s().-]{7,}/.test(v)) {
          o[k] = sha256(v);
        }
        // Remove names and free text (but preserve event_name and other analytics fields)
        else if ((k.toLowerCase().includes('name') && k !== 'event_name') || k.toLowerCase().includes('free_text')) {
          o[k] = undefined;
        }
        // Keep email addresses as requested by user
      } else if (typeof v === 'object') {
        walk(v);
      }
    }
  };
  walk(clone);
  return clone;
}

const sampled = e => Math.random() < Number(sampleMap?.[e] ?? 1.0);

async function track(event, properties = {}, context = {}) {
  const base = { schema_version: schemaVersion, event_name: event, event_ts: new Date().toISOString(), env, ...context };
  const payload = scrub({ ...base, ...properties });
  if (!enabled || dryRun) {
    fs.appendFileSync(LOG_PATH, JSON.stringify({ type: 'track', payload }) + '\n');
    return { ok: true, dryRun: true };
  }
  if (!sampled(event)) return { ok: true, sampled: true };
  return { ok: true, payload }; // controller may persist
}

module.exports = { track, scrub, sha256 };
