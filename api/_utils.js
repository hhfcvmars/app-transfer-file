import crypto from 'crypto';
import { Redis } from '@upstash/redis';

// 初始化 Redis 客户端
let redis;
export const getRedis = () => {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
};

// 生成4位房间号（去掉容易混淆的字符 O/0/I/1/L）
export const generateRoomId = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
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
