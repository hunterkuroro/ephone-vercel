export default async function handler(req, res) {
// 設置 CORS
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {
return res.status(200).end();
}

if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}

try {
const { messages, model = 'gemini-pro', stream = false } = req.body;


// 從環境變數獲取 API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
}

// 轉換 OpenAI 格式到 Gemini 格式
const lastMessage = messages[messages.length - 1];
const prompt = lastMessage.content;

// 調用 Gemini API
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const geminiResponse = await fetch(geminiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  })
});

if (!geminiResponse.ok) {
  const error = await geminiResponse.text();
  console.error('Gemini API Error:', error);
  return res.status(500).json({ error: 'Failed to call Gemini API' });
}

const geminiData = await geminiResponse.json();

// 轉換回 OpenAI 格式
const response = {
  id: `chatcmpl-${Date.now()}`,
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: model,
  choices: [{
    index: 0,
    message: {
      role: 'assistant',
      content: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no response generated.'
    },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: prompt.length,
    completion_tokens: geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0,
    total_tokens: prompt.length + (geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0)
  }
};

return res.json(response);


} catch (error) {
console.error('Chat API Error:', error);
return res.status(500).json({ error: 'Internal server error' });
 }
}
