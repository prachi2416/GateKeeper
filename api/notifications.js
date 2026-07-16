import { notifications, getNextNotificationId } from './mockRepositories.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(notifications.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.status(200).json(all);
    }

    if (req.method === 'POST') {
      const { type, title, message, severity } = req.body;
      const n = {
        id: getNextNotificationId(),
        type,
        title,
        message,
        severity: severity || 'info',
        read: false,
        created_at: new Date().toISOString(),
      };
      notifications.set(n.id, n);
      return res.status(201).json(n);
    }

    if (req.method === 'PUT') {
      const { action } = req.body;
      if (action === 'mark_all_read') {
        notifications.forEach((n) => { n.read = true; });
        return res.status(200).json({ ok: true });
      }
      if (action === 'clear_all') {
        notifications.clear();
        return res.status(200).json({ ok: true });
      }
      const { id, read } = req.body;
      const n = notifications.get(id);
      if (n) {
        n.read = read;
        return res.status(200).json(n);
      }
      return res.status(404).json({ error: 'Not found' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      notifications.delete(id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
