// api/generate.js
export default async function handler(req, res) {
  // CORS 처리 (필요시)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { prompt, systemPrompt } = req.body;
    
    // Vercel Environment Variables에서 API Key를 가져옴
    // 반드시 Vercel 설정에서 GEMINI_API_KEY를 등록해야 합니다.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("API Key is missing in environment variables.");
      return res.status(500).json({ error: '서버 설정 오류: API Key가 누락되었습니다.' });
    }

    // Google Gemini API 호출 (최신 flash 모델 사용)
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
      console.error('Gemini API Error Response:', data);
      throw new Error(data.error?.message || 'Google API 호출에 실패했습니다.');
    }

    // AI 응답 텍스트 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // 클라이언트로 텍스트만 전달 (API Key는 클라이언트로 전달되지 않음)
    res.status(200).json({ text: text });

  } catch (error) {
    console.error('Vercel Serverless Function Error:', error);
    res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
  }
}
