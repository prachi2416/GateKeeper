import { tokenBucketCheck } from '../services/tokenBucket.js';
import { slidingWindowLogCheck } from '../services/slidingWindowLog.js';
import { slidingWindowCounterCheck } from '../services/slidingWindowCounter.js';

// Mock tier configuration
const tierConfig = {
  free: { rpm: 60, burst: 10, refillRate: 1 },
  pro: { rpm: 1000, burst: 100, refillRate: 16 },
  enterprise: { rpm: 10000, burst: 500, refillRate: 166 },
};

// Strategy pattern for algorithm selection
const strategies = {
  token_bucket: tokenBucketCheck,
  sliding_window_log: slidingWindowLogCheck,
  sliding_window_counter: slidingWindowCounterCheck,
};

let defaultAlgorithm = 'token_bucket';

export function setDefaultAlgorithm(algorithm) {
  if (strategies[algorithm]) {
    defaultAlgorithm = algorithm;
  }
}

export function getDefaultAlgorithm() {
  return defaultAlgorithm;
}

export async function rateLimiterMiddleware(clientId, tier = 'free', algorithm = null) {
  const config = tierConfig[tier] || tierConfig.free;
  const algo = algorithm || defaultAlgorithm;
  const strategy = strategies[algo];

  if (!strategy) {
    return { allowed: true, remaining: config.burst, retryAfter: 0, algorithm: algo };
  }

  let result;

  if (algo === 'token_bucket') {
    result = await strategy(clientId, config.burst, config.refillRate);
  } else {
    result = await strategy(clientId, config.rpm, 60000);
  }

  return { ...result, algorithm: algo, limit: config.rpm };
}

export { tierConfig, strategies };
