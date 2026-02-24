import { setCorsHeaders } from '../_utils.js';

// 七牛云 Token API 地址
const QINIU_TOKEN_API = 'https://putonghua.shuipantech.com/api/tool/qiniu/uploadToken';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    try {
        // 服务端代理请求七牛 Token API（避免前端跨域）
        const response = await fetch(QINIU_TOKEN_API);

        if (!response.ok) {
            return res.status(502).json({
                error: `获取七牛 Token 失败 (${response.status})`
            });
        }

        const result = await response.json();

        if (!result.success || result.code !== '0000') {
            return res.status(502).json({
                error: `获取七牛 Token 失败: ${result.message || '未知错误'}`
            });
        }

        return res.status(200).json({
            token: result.data.token,
            key: result.data.key,
        });
    } catch (err) {
        console.error('代理获取七牛 Token 失败:', err);
        return res.status(500).json({ error: '服务器错误: ' + err.message });
    }
}
