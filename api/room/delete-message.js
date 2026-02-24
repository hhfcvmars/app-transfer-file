import { getRedis, getRoomKey, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '方法不允许' });

    try {
        const { roomId, messageId } = req.body;
        if (!roomId || !messageId) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        const db = getRedis();
        const key = getRoomKey(roomId);
        const raw = await db.get(key);

        if (!raw) {
            return res.status(404).json({ error: '房间不存在或已过期' });
        }

        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const index = data.messages.findIndex((m) => m.id === messageId);

        if (index === -1) {
            return res.status(404).json({ error: '消息不存在' });
        }

        data.messages.splice(index, 1);

        const ttl = await db.ttl(key);
        const remainingTtl = ttl > 0 ? ttl : 86400;
        await db.set(key, JSON.stringify(data), { ex: remainingTtl });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('删除消息失败:', err);
        return res.status(500).json({ error: '服务器错误' });
    }
}
