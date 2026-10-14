const ALLOWED_ORIGINS = new Set([
  'https://stas-pintea.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
]);
const VOICES = new Set(['marin', 'cedar', 'coral', 'nova', 'alloy', 'ash', 'ballad', 'echo', 'fable', 'onyx', 'sage', 'shimmer', 'verse']);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
    if (!env.OPENAI_API_KEY) return new Response('Server is not configured', { status: 503, headers });

    let payload;
    try { payload = await request.json(); }
    catch { return new Response('Invalid JSON', { status: 400, headers }); }
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    const voice = typeof payload.voice === 'string' ? payload.voice : '';
    if (!text || text.length > 2000 || !VOICES.has(voice)) {
      return new Response('Invalid text or voice', { status: 400, headers });
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, response_format: 'mp3' }),
      });
      if (!response.ok) return new Response('Speech generation failed', { status: 502, headers });
      return new Response(response.body, {
        headers: { ...headers, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      });
    } catch {
      return new Response('Speech service unavailable', { status: 502, headers });
    }
  },
};
