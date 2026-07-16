import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { clientId } = req.query;
      const { data: client } = await supabase.from('clients').select('*').eq('client_id', clientId).single();
      const { data: logs } = await supabase.from('request_logs').select('*').eq('client_id', clientId).order('timestamp', { ascending: false }).limit(20);
      return res.status(200).json({ client, recentLogs: logs || [] });
    }
    if (req.method === 'POST') {
      const { clientId, request_limit, tier } = req.body;
      const { data, error } = await supabase.from('clients').update({ request_limit, tier }).eq('client_id', clientId).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin error:', err);
    res.status(500).json({ error: err.message });
  }
}
