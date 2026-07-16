import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<50'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const algorithms = ['token_bucket', 'sliding_window_log', 'sliding_window_counter'];
  const algo = algorithms[__VU % algorithms.length];

  const res = http.get(`${BASE_URL}/api/proxy/test`, {
    headers: {
      'X-Client-Id': `client-sustained-${__VU % 10}`,
      'X-Algorithm': algo,
    },
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
}
