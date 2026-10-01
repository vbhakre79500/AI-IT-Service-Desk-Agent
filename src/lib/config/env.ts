import { z } from 'zod';

/**
 * Server-only environment configuration validator.
 * Validates environment variables with Zod, enforcing safe defaults for local
 * development while requiring strict configuration in production.
 *
 * NOTE: Never import this file into Client Components.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // LLM Engine
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'local']).default('local'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('gemini-3.5-flash-lite'),

  // Database
  DATABASE_PATH: z.string().default('./data/autodesk.db'),
  DATABASE_URL: z.string().optional().default(''),

  // Authentication & Session
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters').default('autodesk-secure-session-hackathon-key-2026'),

  // Agent Loop Safety Limits
  MAX_AGENT_STEPS: z.coerce.number().int().min(1).max(25).default(10),
  CONFIDENCE_THRESHOLD: z.coerce.number().min(0.0).max(1.0).default(0.70),
}).refine(
  (data) => {
    // If provider is set to gemini in production, GEMINI_API_KEY must not be empty
    if (data.NODE_ENV === 'production' && data.LLM_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) {
      return false;
    }
    return true;
  },
  {
    message: 'GEMINI_API_KEY is required when LLM_PROVIDER is "gemini" in production',
    path: ['GEMINI_API_KEY'],
  }
).refine(
  (data) => {
    // If provider is set to openai in production, OPENAI_API_KEY must not be empty
    if (data.NODE_ENV === 'production' && data.LLM_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
      return false;
    }
    return true;
  },
  {
    message: 'OPENAI_API_KEY is required when LLM_PROVIDER is "openai" in production',
    path: ['OPENAI_API_KEY'],
  }
);

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Sanitize issues to ensure no sensitive values are printed in error logs
    const errorDetails = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    console.error('❌ Environment configuration validation failed:');
    for (const err of errorDetails) {
      console.error(`   - ${err.field}: ${err.message}`);
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid production environment configuration. Check server environment logs.');
    }

    // In development or test, fall back to safe default schema parse
    return envSchema.parse({});
  }

  return result.data;
}

export const env = parseEnv();
