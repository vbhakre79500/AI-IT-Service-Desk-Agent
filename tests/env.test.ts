import { describe, it } from 'node:test';
import assert from 'node:assert';
import { env } from '../src/lib/config/env';

describe('Phase 14: Environment Configuration Tests', () => {
  it('should load validated environment defaults safely', () => {
    assert.ok(env, 'Environment configuration object must exist');
    assert.ok(['development', 'production', 'test'].includes(env.NODE_ENV));
    assert.ok(['gemini', 'openai', 'local'].includes(env.LLM_PROVIDER));
    assert.strictEqual(typeof env.PORT, 'number');
    assert.strictEqual(typeof env.MAX_AGENT_STEPS, 'number');
    assert.strictEqual(typeof env.CONFIDENCE_THRESHOLD, 'number');
    assert.ok(env.DATABASE_PATH.length > 0);
  });

  it('should verify that AUTH_SECRET meets minimum security length', () => {
    assert.ok(env.AUTH_SECRET.length >= 16, 'AUTH_SECRET must be at least 16 characters for session security');
  });

  it('should ensure API keys default to safe empty strings when not provided', () => {
    if (env.LLM_PROVIDER === 'local') {
      // In local mode, API keys are optional empty strings
      assert.strictEqual(typeof env.GEMINI_API_KEY, 'string');
      assert.strictEqual(typeof env.OPENAI_API_KEY, 'string');
    }
  });
});
