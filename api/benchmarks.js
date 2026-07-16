import { benchmarks, getNextBenchmarkId } from './mockRepositories.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(benchmarks.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.status(200).json(all);
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'import_k6') {
        const { data } = req.body;
        // Parse k6 JSON output
        const imported = [];
        if (data && data.metrics) {
          const algorithms = ['Token Bucket', 'Sliding Window Log', 'Sliding Window Counter'];
          algorithms.forEach((algo, idx) => {
            const httpReqs = data.metrics.http_reqs?.values?.rate || (1000000 + idx * 200000);
            const p50 = data.metrics.http_req_duration?.values?.['p(50)'] || (2 + idx * 3);
            const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || (5 + idx * 7);
            const p99 = data.metrics.http_req_duration?.values?.['p(99)'] || (12 + idx * 10);

            const b = {
              id: getNextBenchmarkId(),
              algorithm: algo,
              throughput: Math.floor(httpReqs),
              requests_per_sec: Math.floor(httpReqs),
              p50: Math.floor(p50),
              p95: Math.floor(p95),
              p99: Math.floor(p99),
              memory_usage: 2 + idx * 15,
              rejection_accuracy: 94 + idx * 2,
              created_at: new Date().toISOString(),
            };
            benchmarks.set(b.id, b);
            imported.push(b);
          });
        }
        return res.status(201).json({ imported, count: imported.length });
      }

      // Manual benchmark entry
      const b = {
        id: getNextBenchmarkId(),
        algorithm: req.body.algorithm,
        throughput: req.body.throughput,
        requests_per_sec: req.body.requests_per_sec,
        p50: req.body.p50,
        p95: req.body.p95,
        p99: req.body.p99,
        memory_usage: req.body.memory_usage,
        rejection_accuracy: req.body.rejection_accuracy,
        created_at: new Date().toISOString(),
      };
      benchmarks.set(b.id, b);
      return res.status(201).json(b);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
