/**
 * High-performance deterministic vector embedding generator and vector math
 * Creates 128-dimensional L2-normalized dense embeddings for IT terminology,
 * ensuring high semantic alignment between related queries and IT runbook concepts.
 */

const VECTOR_DIM = 128;

// Enterprise IT domain semantic concept clusters for semantic projection
const IT_SEMANTIC_ANCHORS = [
  'authentication password credential login lock unlock mfa sso okta identity token',
  'vpn gateway network tunnel connect disconnect timeout handshake latency dns ip ping',
  'portal workday hr web browser chrome safari cache cookie session 401 403 404',
  'device macbook laptop windows hardware compliance disk os update version intune',
  'email outlook exchange mailbox message smtp imap delivery 550 spam calendar',
  'service restart cluster pod kubernetes gitlab database postgres server outage 502',
  'permission access role rbac deny unauthorized admin privilege escalation policy',
  'troubleshoot diagnostic ping trace error exception bug root cause verification',
];

/**
 * Computes a deterministic dense embedding vector for any text.
 * The vector captures both character n-grams, keyword semantics, and domain anchor similarity.
 */
export function generateEmbedding(text: string): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  const vector = new Float32Array(VECTOR_DIM);

  if (tokens.length === 0) {
    return Array.from(vector);
  }

  // 1. Token hash projection across dimensions
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash = 5381;
    for (let c = 0; c < token.length; c++) {
      hash = ((hash << 5) + hash) + token.charCodeAt(c);
      hash = hash & hash; // Convert to 32bit integer
    }

    const baseDim = Math.abs(hash) % VECTOR_DIM;
    vector[baseDim] += 1.0;

    // Character trigrams
    for (let c = 0; c < token.length - 2; c++) {
      const tri = token.slice(c, c + 3);
      let triHash = 0;
      for (let j = 0; j < 3; j++) triHash = (triHash * 31 + tri.charCodeAt(j)) & 0xffff;
      vector[triHash % VECTOR_DIM] += 0.35;
    }
  }

  // 2. Semantic anchor alignment (projects related IT concepts into similar vector spaces)
  IT_SEMANTIC_ANCHORS.forEach((anchor, anchorIdx) => {
    const anchorTokens = anchor.split(' ');
    let overlap = 0;
    for (const t of tokens) {
      if (anchorTokens.includes(t)) {
        overlap += 1;
      }
    }
    if (overlap > 0) {
      const offset = (anchorIdx * 16) % VECTOR_DIM;
      for (let k = 0; k < 16; k++) {
        vector[(offset + k) % VECTOR_DIM] += overlap * 0.8;
      }
    }
  });

  // 3. L2-Normalize the vector so cosine similarity is simply the dot product
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return Array.from(vector);
}

/**
 * Calculates cosine similarity between two normalized embedding vectors.
 * Returns value between -1.0 and 1.0 (typically 0.0 to 1.0 for positive embeddings).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  return dot / denom;
}
