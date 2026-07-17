'use strict';

/* DATA PATH v3.1 - 用語インデックス補助 */
function buildGlossarySearchIndex(terms) {
  return new Map((terms || []).map(term => [String(term.name || '').trim().toLocaleLowerCase('ja'), term]));
}
function collectUnregisteredRelatedTerms(terms) {
  const index = buildGlossarySearchIndex(terms);
  return [...new Set((terms || []).flatMap(term => term.related || []).filter(name => !index.has(String(name).trim().toLocaleLowerCase('ja'))))];
}
