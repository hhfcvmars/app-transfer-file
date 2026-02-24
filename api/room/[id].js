import { getRedis, getRoomKey, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: '方法不允许' });

    try {
        const { id: roomId } = req.query;
        const db = getRedis();
        const raw = await db.get(getRoomKey(roomId));

        if (!raw) {
            return res.status(404).json({ error: '房间不存在或已过期' });
        }

        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        return res.status(200).json({
            messages: data.messages || [],
            createdAt: data.createdAt,
        });
    } catch (err) {
        console.error('获取房间数据失败:', err);
        return res.status(500).json({ error: '服务器错误' });
    }
}
