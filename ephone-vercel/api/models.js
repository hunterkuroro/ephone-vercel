export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(200).end();
}

if (req.method !== ‘GET’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

// 返回 Gemini 模型列表（模擬 OpenAI 格式）
const models = {
object: ‘list’,
data: [
{
id: ‘gemini-pro’,
object: ‘model’,
created: 1677610602,
owned_by: ‘google’
},
{
id: ‘gemini-pro-vision’,
object: ‘model’,
created: 1677610602,
owned_by: ‘google’
}
]
};

return res.json(models);
}
