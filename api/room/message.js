import crypto from 'crypto';
import { getRedis, getRoomKey, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '方法不允许' });

    try {
        const { roomId, type, content, fileName, fileSize, fileUrl } = req.body;
        if (!roomId) return res.status(400).json({ error: '缺少房间号' });

        const db = getRedis();
        const key = getRoomKey(roomId);
        const raw = await db.get(key);

        if (!raw) {
            return res.status(404).json({ error: '房间不存在或已过期' });
        }

        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // 构建消息对象
        const message = {
            id: crypto.randomUUID(),
            type,
            timestamp: Date.now(),
        };

        if (type === 'text') {
            if (!content || content.trim() === '') {
                return res.status(400).json({ error: '文本内容不能为空' });
            }
            message.content = content;
        } else if (type === 'file') {
            if (!fileName || !fileUrl) {
                return res.status(400).json({ error: '文件信息不完整' });
            }
            message.fileName = fileName;
            message.fileSize = fileSize;
            message.fileUrl = fileUrl;
        } else {
            return res.status(400).json({ error: '无效的消息类型' });
        }

        // 获取剩余 TTL 以便更新时保持
        const ttl = await db.ttl(key);
        const remainingTtl = ttl > 0 ? ttl : 86400;

        data.messages.push(message);
        await db.set(key, JSON.stringify(data), { ex: remainingTtl });

        return res.status(200).json({ success: true, message });
    } catch (err) {
        console.error('发送消息失败:', err);
        return res.status(500).json({ error: '服务器错误' });
    }
}
