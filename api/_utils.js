import crypto from 'crypto';
import { Redis } from '@upstash/redis';

// 初始化 Redis 客户端
let redis;
export const getRedis = () => {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      throw new Error('Redis 环境变量未设置: UPSTASH_REDIS_REST_URL 或 UPSTASH_REDIS_REST_TOKEN');
    }
    
    redis = new Redis({ url, token });
  }
  return redis;
};

// 生成4位房间号（格式：3位数字 + 1位A-F字母）
export const generateRoomId = () => {
  const digits = '0123456789';
  const letters = 'ABCDEF';
  let result = '';
  
  // 生成3位数字
  const bytes = crypto.randomBytes(3);
  for (let i = 0; i < 3; i++) {
    result += digits.charAt(bytes[i] % 10);
  }
  
  // 生成1位A-F字母
  const letterBytes = crypto.randomBytes(1);
  result += letters.charAt(letterBytes[0] % 6);
  
  return result;
};

// 生成消息ID（兼容 Vercel 环境）
export const generateMessageId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
};

// KV key
export const getRoomKey = (roomId) => `room:${roomId.toUpperCase()}`;

// CORS 头设置
export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// 数据过期时间：24小时（秒）
export const ROOM_TTL = 86400;
