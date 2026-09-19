import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Import this shared ESM helper without changing the Next.js package module type.
const source = await readFile(new URL('../lib/career.js', import.meta.url), 'utf8');
const { articleBlocks, articleHref } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('article body preserves paragraphs, headings, list items and quotes', () => {
  const blocks = articleBlocks('Giriş.\r\n\r\n## Hazırlıq\r\n\r\n- CV\n- Müsahibə\n\n> Məsləhət');
  assert.deepEqual(blocks.map(block => block.type), ['paragraph', 'heading', 'list', 'quote']);
  assert.equal(blocks[1].id, 'bolme-1');
  assert.deepEqual(blocks[2].items, ['CV', 'Müsahibə']);
});

test('HTML remains text and article paths encode dynamic segments', () => {
  assert.deepEqual(articleBlocks('<script>alert(1)</script>'), [{ type: 'paragraph', text: '<script>alert(1)</script>' }]);
  assert.equal(articleHref({ slug: 'cv/another?draft=1' }), '/karyera-meslehetleri/cv%2Fanother%3Fdraft%3D1');
});
