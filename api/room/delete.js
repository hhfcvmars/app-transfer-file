import { getRedis, getRoomKey, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '方法不允许' });

    try {
        const { roomId } = req.body;
        if (!roomId) {
            return res.status(400).json({ error: '缺少房间号' });
        }

        const db = getRedis();
        const key = getRoomKey(roomId);
        
        const result = await db.del(key);
        
        if (result === 0) {
            return res.status(404).json({ error: '房间不存在或已过期' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('删除房间失败:', err);
        return res.status(500).json({ error: '服务器错误' });
    }
}
