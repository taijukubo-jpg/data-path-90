'use strict';

/* DATA PATH v4.0.3 - 用語インデックス／カタログ互換処理 */

/**
 * glossary-data.js の旧配列形式を、用語集UIが扱うオブジェクト形式へ変換する。
 * 読み込み順は glossary-data.js → glossary-index.js → glossary-ui.js。
 */
function normalizeCatalogEntry(entry) {
  if (!Array.isArray(entry)) return entry;

  const [name, category, meaning, example, related = []] = entry;
  return {
    name,
    formalName: FORMAL_NAME_MAP[name] || '-',
    category,
    meaning,
    example,
    related: Array.isArray(related) ? related : []
  };
}

if (Array.isArray(GLOSSARY_CATALOG)) {
  for (let index = 0; index < GLOSSARY_CATALOG.length; index += 1) {
    GLOSSARY_CATALOG[index] = normalizeCatalogEntry(GLOSSARY_CATALOG[index]);
  }
}

function buildGlossarySearchIndex(terms) {
  return new Map(
    (terms || [])
      .filter(term => term && typeof term === 'object' && term.name)
      .map(term => [String(term.name).trim().toLocaleLowerCase('ja'), term])
  );
}

function collectUnregisteredRelatedTerms(terms) {
  const index = buildGlossarySearchIndex(terms);
  return [...new Set(
    (terms || [])
      .filter(term => term && typeof term === 'object')
      .flatMap(term => Array.isArray(term.related) ? term.related : [])
      .filter(name => !index.has(String(name).trim().toLocaleLowerCase('ja')))
  )];
}
