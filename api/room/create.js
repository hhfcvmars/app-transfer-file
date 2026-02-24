import { getRedis, generateRoomId, getRoomKey, setCorsHeaders, ROOM_TTL } from '../_utils.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '方法不允许' });

    try {
        const db = getRedis();

        // 生成唯一房间号（最多尝试10次避免碰撞）
        let roomId;
        let attempts = 0;
        do {
            roomId = generateRoomId();
            const existing = await db.get(getRoomKey(roomId));
            if (!existing) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return res.status(500).json({ error: '房间号生成失败，请重试' });
        }

        const roomData = {
            messages: [],
            createdAt: Date.now(),
        };

        // 保存到 Redis，TTL = 24小时
        await db.set(getRoomKey(roomId), JSON.stringify(roomData), { ex: ROOM_TTL });

        return res.status(200).json({ roomId });
    } catch (err) {
        console.error('创建房间失败:', err);
        return res.status(500).json({ error: '服务器错误: ' + err.message });
    }
}
