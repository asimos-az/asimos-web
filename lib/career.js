const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://asimos-backend.onrender.com').replace(/\/+$/, '');

export async function fetchCareer(path = '', { signal } = {}) {
  const response = await fetch(`${API_BASE}/career-articles${path}`, {
    cache: 'no-store', signal: signal || AbortSignal.timeout(15000), headers: { Accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Məqalələr yüklənmədi. Bir az sonra yenidən yoxlayın.');
  return response.json();
}

export function articleHref(article) {
  return `/karyera-meslehetleri/${encodeURIComponent(article.slug)}`;
}

export function articleBlocks(body = '') {
  return body.replace(/\r\n/g, '\n').split(/\n\s*\n/).filter(Boolean).map((text, index) => {
    if (/^##?\s/.test(text)) return { type: 'heading', text: text.replace(/^##?\s+/, ''), id: `bolme-${index}` };
    if (text.split('\n').every(line => /^[-*]\s/.test(line))) return { type: 'list', items: text.split('\n').map(line => line.replace(/^[-*]\s+/, '')) };
    if (text.startsWith('> ')) return { type: 'quote', text: text.replace(/^>\s?/gm, '') };
    return { type: 'paragraph', text };
  });
}
