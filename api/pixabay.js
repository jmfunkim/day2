// Vercel 서버리스 함수: 브라우저 대신 서버에서 Pixabay를 호출해 API Key를 숨깁니다.
// Key는 Vercel 환경변수 PIXABAY_API_KEY 에서 읽습니다.
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력하세요.' });
  }

  const url = 'https://pixabay.com/api/?' + new URLSearchParams({
    key, q, image_type: 'photo', per_page: '10', safesearch: 'true'
  });

  try {
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(r.status).json({
        error: r.status === 429 ? '요청 한도를 넘었습니다. 잠시 후 다시 시도하세요.' : 'Pixabay 오류 (' + r.status + ')'
      });
    }
    const data = await r.json();
    // 필요한 값만 내려보냅니다.
    const hits = data.hits.map(h => ({
      url: h.webformatURL, tags: h.tags, user: h.user, page: h.pageURL
    }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ hits });
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay에 연결하지 못했습니다.' });
  }
};
