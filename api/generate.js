// Vercel Serverless Function (Node.js)
// 이 코드는 오직 Vercel 서버에서만 실행되므로 클라이언트에게 API Key가 노출되지 않습니다.

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, systemPrompt } = req.body;
  
  // Vercel 환경변수에서 API Key 로드
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error: API key is missing.' });
  }

  try {
    // 안정화된 프로덕션용 모델 사용 (gemini-2.5-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API call failed on server.');
    }

    // 결과 텍스트 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 클라이언트로 결과만 반환 (API Key 없음)
    res.status(200).json({ text });

  } catch (error) {
    console.error('Serverless Error:', error);
    res.status(500).json({ error: error.message });
  }
}