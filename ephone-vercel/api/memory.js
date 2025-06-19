export default async function handler(req, res) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, body, query } = req;
  const userId = query.userId || body?.userId;

  try {
    switch (method) {
      case 'GET':
        // 獲取用戶記憶
        const memory = await getMemory(userId);
        return res.json({ success: true, data: memory });

      case 'POST':
        // 保存記憶
        await saveMemory(userId, body.memory);
        return res.json({ success: true });

      case 'PUT':
        // 更新記憶
        await updateMemory(userId, body.memory);
        return res.json({ success: true });

      case 'DELETE':
        // 刪除記憶
        await deleteMemory(userId);
        return res.json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Memory API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 記憶管理函數
async function getMemory(userId) {
  // 使用環境變數配置的數據庫
  const dbType = process.env.DB_TYPE || 'redis';

  if (dbType === 'redis') {
    const redis = getRedisClient();
    const memory = await redis.get(`memory:${userId}`);
    return memory ? JSON.parse(memory) : [];
  } else if (dbType === 'mysql') {
    const mysql = getMysqlClient();
    const [rows] = await mysql.execute(
      'SELECT memory_data FROM user_memory WHERE user_id = ?',
      [userId]
    );
    return rows[0]?.memory_data ? JSON.parse(rows[0].memory_data) : [];
  }
}

async function saveMemory(userId, memory) {
  const dbType = process.env.DB_TYPE || 'redis';

  if (dbType === 'redis') {
    const redis = getRedisClient();
    await redis.set(`memory:${userId}`, JSON.stringify(memory));
  } else if (dbType === 'mysql') {
    const mysql = getMysqlClient();
    await mysql.execute(
      'INSERT INTO user_memory (user_id, memory_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE memory_data = ?',
      [userId, JSON.stringify(memory), JSON.stringify(memory)]
    );
  }
}

async function updateMemory(userId, memory) {
  await saveMemory(userId, memory);
}

async function deleteMemory(userId) {
  const dbType = process.env.DB_TYPE || 'redis';

  if (dbType === 'redis') {
    const redis = getRedisClient();
    await redis.del(`memory:${userId}`);
  } else if (dbType === 'mysql') {
    const mysql = getMysqlClient();
    await mysql.execute('DELETE FROM user_memory WHERE user_id = ?', [userId]);
  }
}

// 數據庫連接函數
function getRedisClient() {
  const { createClient } = require('redis');
  return createClient({
    url: process.env.REDIS_URL
  });
}

function getMysqlClient() {
  const mysql = require('mysql2/promise');
  return mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
}
