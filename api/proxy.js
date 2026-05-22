export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetUrl = `https://admin.unionteams.ru${req.url}`;
    console.log(`Proxying: ${targetUrl}`);

    // Подготовка заголовков
    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
      'Accept-Language': 'ru-RU,ru;q=0.9',
      'Origin': 'https://admin.unionteams.ru',
      'Referer': 'https://admin.unionteams.ru/',
      'Content-Type': 'application/json'
    };

    // Передаём токен авторизации, если он есть
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return res.status(response.status).json({ error: `API error: ${response.status}` });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}