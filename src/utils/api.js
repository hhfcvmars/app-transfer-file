const API_BASE = '/api';

// ===== 七牛云配置 =====
const QINIU_DOMAIN = 'https://img.shuipantech.com';
const QINIU_UPLOAD_URL = 'https://upload.qiniup.com';

// ===== 房间 API =====

// 创建房间
export const createRoom = async () => {
    const res = await fetch(`${API_BASE}/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    return res.json();
};

// 获取房间数据
export const getRoomData = async (roomId) => {
    const res = await fetch(`${API_BASE}/room/${roomId}`);
    return res.json();
};

// 发送文本消息
export const sendTextMessage = async (roomId, content) => {
    const res = await fetch(`${API_BASE}/room/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, type: 'text', content }),
    });
    return res.json();
};

// 发送文件消息（上传完成后调用）
export const sendFileMessage = async (roomId, fileInfo) => {
    const res = await fetch(`${API_BASE}/room/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            roomId,
            type: 'file',
            fileName: fileInfo.fileName,
            fileSize: fileInfo.fileSize,
            fileUrl: fileInfo.fileUrl,
        }),
    });
    return res.json();
};

// 删除消息
export const deleteMessage = async (roomId, messageId) => {
    const res = await fetch(`${API_BASE}/room/delete-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, messageId }),
    });
    return res.json();
};

// 删除房间
export const deleteRoom = async (roomId) => {
    const res = await fetch(`${API_BASE}/room/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
    });
    return res.json();
};

// ===== 七牛云上传 =====

// 通过后端代理获取七牛上传凭证（避免 CORS 跨域问题）
const getQiniuUploadToken = async () => {
    const response = await fetch(`${API_BASE}/upload/token`, { method: 'POST' });
    if (!response.ok) {
        throw new Error(`获取 Token 失败 (${response.status})`);
    }
    const result = await response.json();
    if (result.error) {
        throw new Error(result.error);
    }
    return { token: result.token, key: result.key };
};

// 上传文件到七牛云（带进度回调）
export const uploadToQiniu = (file, token, key, onProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('token', token);
        formData.append('key', key);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                if (result.error) {
                    reject(new Error(`上传失败: ${result.error}`));
                } else {
                    const finalKey = result.key || key;
                    resolve(`${QINIU_DOMAIN}/${finalKey}`);
                }
            } else {
                reject(new Error(`上传失败: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误')));
        xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

        xhr.open('POST', QINIU_UPLOAD_URL);
        xhr.send(formData);
    });
};

// 完整的文件上传流程（获取 Token + 上传到七牛）
export const uploadFile = async (file, onProgress) => {
    // 1. 获取上传凭证
    const { token, key } = await getQiniuUploadToken();
    // 2. 将 key 中的扩展名替换为实际文件的扩展名，确保 CDN 能识别正确的 content-type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fixedKey = ext ? key.replace(/\.[^.]+$/, `.${ext}`) : key;
    // 3. 上传到七牛
    const fileUrl = await uploadToQiniu(file, token, fixedKey, onProgress);
    return fileUrl;
};

// ===== 工具函数 =====

// 格式化文件大小
export const formatFileSize = (bytes) => {
    if (!bytes) return '未知大小';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 格式化时间
export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    if (date.toDateString() !== now.toDateString()) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}-${day} ${time}`;
    }
    return time;
};
