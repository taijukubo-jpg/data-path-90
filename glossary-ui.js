'use strict';

/* DATA PATH v3.1.1 - 用語集UI */
const glossaryElementIds = [
  'homeGlossaryCount','homeGlossaryPreview','openGlossaryBtn',
  'glossaryCount','glossarySearch','glossaryCategory','toggleGlossaryForm',
  'glossaryForm','glossaryEditId','termName','termCategory','termMeaning',
  'termExample','termRelated','saveGlossaryTerm','cancelGlossaryEdit',
  'glossaryStatus','glossaryQuickInput','importGlossaryText',
  'copyGlossaryTemplate','recentGlossary','missingTermsPanel','missingTermCount',
  'missingTermList','registerMissingTerms','glossaryList',
  'termFirstDay','termUnderstanding','homeNewTermCount','homeNewTermPreview',
  'openNewTermsBtn','homeUnderstanding','homeUnderstandingPreview',
  'openUnderstandingBtn','homeReviewTitle','homeReviewPreview','openReviewBtn',
  'understandingSummary','understandingBars','favoriteCount','favoriteGlossary',
  'reviewCount','reviewGlossary'
];

const glossaryElement = Object.fromEntries(
  glossaryElementIds.map((id) => [id, document.getElementById(id)])
);

function normalizeGlossaryName(value) {
  return String(value || '').trim().toLocaleLowerCase('ja');
}

function normalizeRelated(value) {
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  return String(value || '').split(/[、,]/).map(v => v.trim()).filter(Boolean);
}

function makeGlossaryId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `term-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysSince(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

function isNewTerm(term) {
  return daysSince(term.createdAt || term.updatedAt) <= 3;
}

function understandingStars(value) {
  const score = Number(value) || 0;
  return score ? `${'★'.repeat(score)}${'☆'.repeat(5-score)}` : '未評価';
}

function normalizeGlossaryEntry(term) {
  return {
    ...term,
    firstDay: Number(term.firstDay) || null,
    understanding: Math.max(0, Math.min(5, Number(term.understanding) || 0)),
    favorite: Boolean(term.favorite),
    updatedAt: term.updatedAt || term.createdAt || new Date().toISOString()
  };
}

function migrateGlossaryCatalog() {
  if (!Array.isArray(state.glossary)) state.glossary = [];

  // 旧版データを壊さないよう、移行前の内容を一度だけ別キーへ退避する。
  const backupKey = 'data-path-glossary-backup-before-3.1.1';
  if (!localStorage.getItem(backupKey) && state.glossary.length) {
    localStorage.setItem(backupKey, JSON.stringify(state.glossary));
  }

  state.glossary = state.glossary
    .filter(term => term && typeof term === 'object' && term.name)
    .map(normalizeGlossaryEntry);

  const existing = new Set(
    state.glossary.map(term => normalizeGlossaryName(term.name))
  );

  let added = 0;

  for (const catalogTerm of GLOSSARY_CATALOG) {
    const normalizedName = normalizeGlossaryName(catalogTerm.name);
    if (existing.has(normalizedName)) continue;

    state.glossary.push(
      normalizeGlossaryEntry({
        ...catalogTerm,
        id: catalogTerm.id || makeGlossaryId()
      })
    );
    existing.add(normalizedName);
    added += 1;
  }

  const needsVersionUpdate = state.dataVersion !== '3.1.1';
  state.dataVersion = '3.1.1';

  if (added || needsVersionUpdate) saveState();
  return added;
}

function glossaryMap() {
  return new Map(state.glossary.map(term => [normalizeGlossaryName(term.name), term]));
}

function glossaryCategories() {
  return [...new Set(state.glossary.map(t => t.category || '未分類'))]
    .sort((a,b) => a.localeCompare(b,'ja'));
}

function filteredGlossaryTerms() {
  const keyword = glossaryElement.glossarySearch.value.trim().toLocaleLowerCase('ja');
  const category = glossaryElement.glossaryCategory.value;
  return [...state.glossary]
    .filter(t => !category || t.category === category)
    .filter(t => {
      if (!keyword) return true;
      return [t.name,t.category,t.meaning,t.example,...(t.related || [])]
        .join(' ').toLocaleLowerCase('ja').includes(keyword);
    })
    .sort((a,b) => a.name.localeCompare(b.name,'ja'));
}

function renderGlossaryCategoryOptions() {
  const current = glossaryElement.glossaryCategory.value;
  const cats = glossaryCategories();
  glossaryElement.glossaryCategory.innerHTML = [
    '<option value="">すべてのカテゴリ</option>',
    ...cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
  ].join('');
  glossaryElement.glossaryCategory.value = cats.includes(current) ? current : '';
}

function relatedHtml(term, map) {
  if (!term.related?.length) return '';
  return `<div class="glossary-row"><strong>関連用語：</strong><div class="related-links">${term.related.map(name => {
    const target = map.get(normalizeGlossaryName(name));
    return target
      ? `<button class="related-link" type="button" data-related-id="${escapeHtml(target.id)}">${escapeHtml(name)}</button>`
      : `<span class="related-missing" title="未登録">${escapeHtml(name)} ⚠</span>`;
  }).join('')}</div></div>`;
}

function termCardHtml(term, map) {
  const created = term.createdAt ? new Date(term.createdAt).toLocaleDateString('ja-JP') : '不明';
  const updated = term.updatedAt ? new Date(term.updatedAt).toLocaleDateString('ja-JP') : created;
  return `<article class="glossary-item" id="term-${escapeHtml(term.id)}">
    <div class="glossary-item-header">
      <div>
        <div class="term-title-line">
          <h3 class="glossary-item-title">${escapeHtml(term.name)}</h3>
          ${isNewTerm(term) ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <span class="glossary-badge">${escapeHtml(term.category)}</span>
      </div>
      <div class="glossary-item-actions">
        <button class="favorite-button ${term.favorite ? 'is-favorite' : ''}" type="button" data-favorite-term="${escapeHtml(term.id)}" aria-label="お気に入り">${term.favorite ? '★' : '☆'}</button>
        <button type="button" data-edit-term="${escapeHtml(term.id)}">編集</button>
        <button class="danger" type="button" data-delete-term="${escapeHtml(term.id)}">削除</button>
      </div>
    </div>
    <div class="glossary-body">
      <div class="glossary-row"><strong>意味：</strong>${escapeHtml(term.meaning)}</div>
      ${term.example ? `<div class="glossary-row"><strong>実務例：</strong>${escapeHtml(term.example)}</div>` : ''}
      <div class="term-meta-grid">
        <span><strong>初登場：</strong>${term.firstDay ? `Day ${term.firstDay}` : '未設定'}</span>
        <span><strong>理解度：</strong>${understandingStars(term.understanding)}</span>
        <span><strong>登録日：</strong>${created}</span>
        <span><strong>更新日：</strong>${updated}</span>
      </div>
      ${relatedHtml(term,map)}
    </div>
  </article>`;
}

function renderGlossary() {
  renderGlossaryCategoryOptions();
  const terms = filteredGlossaryTerms();
  const map = glossaryMap();
  const keywordActive = Boolean(glossaryElement.glossarySearch.value.trim());
  const categoryFilter = glossaryElement.glossaryCategory.value;
  glossaryElement.glossaryCount.textContent = `${state.glossary.length}語（表示 ${terms.length}語）`;

  const groups = new Map();
  for (const term of terms) {
    if (!groups.has(term.category)) groups.set(term.category, []);
    groups.get(term.category).push(term);
  }

  if (!terms.length) {
    glossaryElement.glossaryList.innerHTML = '<div class="glossary-empty">条件に一致する用語がありません。</div>';
  } else {
    glossaryElement.glossaryList.innerHTML = [...groups.entries()].map(([category,items]) => {
      const open = keywordActive || Boolean(categoryFilter);
      const visible = open ? items : items.slice(0,GLOSSARY_PREVIEW_LIMIT);
      return `<details class="glossary-category" data-category="${escapeHtml(category)}" ${open ? 'open' : ''}>
        <summary><span class="glossary-category-title">${escapeHtml(category)}</span><span class="glossary-category-count">${items.length}語</span></summary>
        <div class="glossary-category-body">
          ${visible.map(t => termCardHtml(t,map)).join('')}
          ${!open && items.length > GLOSSARY_PREVIEW_LIMIT ? `<button class="category-more" type="button" data-expand-category="${escapeHtml(category)}">残り${items.length-GLOSSARY_PREVIEW_LIMIT}語を表示</button>` : ''}
        </div>
      </details>`;
    }).join('');
  }

  bindGlossaryDynamicEvents();
  renderRecentGlossary();
  renderMissingTerms();
  renderHomeGlossary();
}

function bindGlossaryDynamicEvents() {
  glossaryElement.glossaryList.querySelectorAll('[data-edit-term]').forEach(b => b.onclick = () => startGlossaryEdit(b.dataset.editTerm));
  glossaryElement.glossaryList.querySelectorAll('[data-delete-term]').forEach(b => b.onclick = () => deleteGlossaryTerm(b.dataset.deleteTerm));
  glossaryElement.glossaryList.querySelectorAll('[data-favorite-term]').forEach(b => b.onclick = () => toggleFavorite(b.dataset.favoriteTerm));
  glossaryElement.glossaryList.querySelectorAll('[data-related-id]').forEach(b => b.onclick = () => navigateToGlossaryTerm(b.dataset.relatedId));
  glossaryElement.glossaryList.querySelectorAll('[data-expand-category]').forEach(b => b.onclick = () => {
    const details = b.closest('details');
    glossaryElement.glossarySearch.value = '';
    glossaryElement.glossaryCategory.value = b.dataset.expandCategory;
    renderGlossary();
    details?.scrollIntoView({behavior:'smooth',block:'start'});
  });
}

function navigateToGlossaryTerm(id) {
  const term = state.glossary.find(t => t.id === id);
  if (!term) return;
  glossaryElement.glossarySearch.value = term.name;
  glossaryElement.glossaryCategory.value = '';
  renderGlossary();
  requestAnimationFrame(() => {
    const card = document.getElementById(`term-${id}`);
    if (!card) return;
    card.classList.add('is-target');
    card.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(() => card.classList.remove('is-target'),1800);
  });
}

function toggleFavorite(id) {
  state.glossary = state.glossary.map(term => term.id === id
    ? { ...term, favorite: !term.favorite, updatedAt: new Date().toISOString() }
    : term);
  saveState();
  renderGlossary();
}

function categoryUnderstandingStats() {
  const groups = new Map();
  for (const term of state.glossary) {
    if (!groups.has(term.category)) groups.set(term.category, []);
    groups.get(term.category).push(Number(term.understanding) || 0);
  }
  return [...groups.entries()].map(([category, values]) => {
    const rated = values.filter(Boolean);
    const average = rated.length ? rated.reduce((a,b)=>a+b,0)/rated.length : 0;
    return { category, average, rated: rated.length, total: values.length };
  }).sort((a,b)=>b.average-a.average || a.category.localeCompare(b.category,'ja'));
}

function renderUnderstanding() {
  const stats = categoryUnderstandingStats();
  const rated = state.glossary.filter(t => Number(t.understanding) > 0);
  const average = rated.length ? rated.reduce((sum,t)=>sum+Number(t.understanding),0)/rated.length : 0;
  glossaryElement.understandingSummary.textContent = rated.length ? `全体平均 ${average.toFixed(1)} / 5（${rated.length}語を評価）` : 'まだ評価されていません';
  glossaryElement.understandingBars.innerHTML = stats.map(s => `<div class="understanding-row">
    <div class="understanding-label"><span>${escapeHtml(s.category)}</span><small>${s.rated}/${s.total}語</small></div>
    <div class="understanding-track"><span style="width:${(s.average/5)*100}%"></span></div>
    <b>${s.average ? s.average.toFixed(1) : '-'}</b>
  </div>`).join('');
  glossaryElement.homeUnderstanding.textContent = rated.length ? `${average.toFixed(1)} / 5` : '未評価';
  glossaryElement.homeUnderstandingPreview.textContent = rated.length ? `${rated.length}語を評価済み。理解度2以下を優先して復習しよう。` : '用語の編集画面から理解度を設定できます。';
}

function renderFavorites() {
  const favorites = state.glossary.filter(t => t.favorite).sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  glossaryElement.favoriteCount.textContent = `${favorites.length}語`;
  glossaryElement.favoriteGlossary.innerHTML = favorites.map(t => `<button class="recent-term" type="button" data-favorite-id="${escapeHtml(t.id)}">★ ${escapeHtml(t.name)}</button>`).join('') || '<span class="muted">お気に入りはまだありません。</span>';
  glossaryElement.favoriteGlossary.querySelectorAll('[data-favorite-id]').forEach(b => b.onclick=()=>navigateToGlossaryTerm(b.dataset.favoriteId));
}

function reviewTerms() {
  return [...state.glossary]
    .filter(t => Number(t.understanding) > 0 && Number(t.understanding) <= 2)
    .sort((a,b)=>Number(a.understanding)-Number(b.understanding) || new Date(a.updatedAt)-new Date(b.updatedAt));
}

function renderReview() {
  const reviews = reviewTerms();
  glossaryElement.reviewCount.textContent = `${reviews.length}語`;
  glossaryElement.reviewGlossary.innerHTML = reviews.slice(0,10).map(t => `<button class="recent-term review-term" type="button" data-review-id="${escapeHtml(t.id)}">${understandingStars(t.understanding)} ${escapeHtml(t.name)}</button>`).join('') || '<span class="muted">理解度1〜2の用語はありません。</span>';
  glossaryElement.reviewGlossary.querySelectorAll('[data-review-id]').forEach(b => b.onclick=()=>navigateToGlossaryTerm(b.dataset.reviewId));
  glossaryElement.homeReviewTitle.textContent = reviews.length ? `${reviews.length}語` : 'なし';
  glossaryElement.homeReviewPreview.textContent = reviews.length ? reviews.slice(0,3).map(t=>t.name).join('、') : '理解度が低い用語はありません。';
}

function renderRecentGlossary() {
  const recent = [...state.glossary]
    .sort((a,b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0,5);
  glossaryElement.recentGlossary.innerHTML = recent.map(t => `<button class="recent-term" type="button" data-recent-id="${escapeHtml(t.id)}">${isNewTerm(t) ? '🆕 ' : ''}${escapeHtml(t.name)}</button>`).join('') || '<span class="muted">まだ登録されていません。</span>';
  glossaryElement.recentGlossary.querySelectorAll('[data-recent-id]').forEach(b => b.onclick = () => navigateToGlossaryTerm(b.dataset.recentId));
}

function missingRelatedNames() {
  const map = glossaryMap();
  return [...new Set(state.glossary.flatMap(t => t.related || []).filter(name => !map.has(normalizeGlossaryName(name))))]
    .sort((a,b) => a.localeCompare(b,'ja'));
}

function renderMissingTerms() {
  const missing = missingRelatedNames();
  glossaryElement.missingTermCount.textContent = `${missing.length}語`;
  glossaryElement.missingTermList.innerHTML = missing.map(n => `<span class="missing-term-chip">${escapeHtml(n)}</span>`).join('') || '<span class="muted">未登録の関連用語はありません。</span>';
  const catalog = new Set(GLOSSARY_CATALOG.map(t => normalizeGlossaryName(t.name)));
  const resolvable = missing.filter(n => catalog.has(normalizeGlossaryName(n))).length;
  glossaryElement.registerMissingTerms.disabled = resolvable === 0;
  glossaryElement.registerMissingTerms.textContent = resolvable ? `定義済み${resolvable}語を一括登録` : '一括登録できる用語はありません';
}

function renderHomeGlossary() {
  glossaryElement.homeGlossaryCount.textContent = `${state.glossary.length}語`;
  const recent = [...state.glossary]
    .sort((a,b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0,3).map(t => t.name);
  glossaryElement.homeGlossaryPreview.textContent = recent.length ? `最近追加：${recent.join('、')}` : '用語を登録すると、最近追加した用語がここに表示されます。';
  const newTerms = state.glossary.filter(isNewTerm).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  glossaryElement.homeNewTermCount.textContent = `${newTerms.length}語`;
  glossaryElement.homeNewTermPreview.textContent = newTerms.length ? newTerms.slice(0,3).map(t=>t.name).join('、') : '直近3日以内に追加された用語はありません。';
  renderUnderstanding();
  renderFavorites();
  renderReview();
}

function resetGlossaryForm() {
  glossaryElement.glossaryForm.reset();
  glossaryElement.glossaryEditId.value = '';
  glossaryElement.termFirstDay.value = '';
  glossaryElement.termUnderstanding.value = '0';
  glossaryElement.glossaryStatus.textContent = '';
  glossaryElement.saveGlossaryTerm.textContent = '保存';
}
function openGlossaryForm(){glossaryElement.glossaryForm.classList.remove('is-hidden');glossaryElement.termName.focus()}
function closeGlossaryForm(){resetGlossaryForm();glossaryElement.glossaryForm.classList.add('is-hidden')}
function startGlossaryEdit(id){
  const t=state.glossary.find(x=>x.id===id); if(!t)return;
  glossaryElement.glossaryEditId.value=t.id; glossaryElement.termName.value=t.name; glossaryElement.termCategory.value=t.category;
  glossaryElement.termMeaning.value=t.meaning; glossaryElement.termExample.value=t.example||''; glossaryElement.termRelated.value=(t.related||[]).join(', ');
  glossaryElement.termFirstDay.value=t.firstDay||''; glossaryElement.termUnderstanding.value=String(t.understanding||0);
  glossaryElement.saveGlossaryTerm.textContent='更新'; glossaryElement.glossaryStatus.textContent='編集中'; openGlossaryForm();
  glossaryElement.glossaryForm.scrollIntoView({behavior:'smooth',block:'center'});
}
function saveGlossaryFromForm(){
  const id=glossaryElement.glossaryEditId.value;
  const old=state.glossary.find(x=>x.id===id);
  const entry=normalizeGlossaryEntry({id:id||makeGlossaryId(),name:glossaryElement.termName.value.trim(),category:glossaryElement.termCategory.value.trim(),meaning:glossaryElement.termMeaning.value.trim(),example:glossaryElement.termExample.value.trim(),related:normalizeRelated(glossaryElement.termRelated.value),firstDay:Number(glossaryElement.termFirstDay.value)||null,understanding:Number(glossaryElement.termUnderstanding.value)||0,favorite:old?.favorite||false,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
  if(!entry.name||!entry.category||!entry.meaning){glossaryElement.glossaryStatus.textContent='用語・カテゴリ・意味は必須です。';return}
  const duplicate=state.glossary.find(x=>normalizeGlossaryName(x.name)===normalizeGlossaryName(entry.name)&&x.id!==id);
  if(duplicate){glossaryElement.glossaryStatus.textContent='同名の用語が既に登録されています。';return}
  state.glossary=id?state.glossary.map(x=>x.id===id?entry:x):[...state.glossary,entry]; saveState(); closeGlossaryForm(); renderGlossary();
}
function deleteGlossaryTerm(id){const t=state.glossary.find(x=>x.id===id);if(!t||!confirm(`「${t.name}」を削除しますか？`))return;state.glossary=state.glossary.filter(x=>x.id!==id);saveState();renderGlossary()}

function parseGlossaryBlock(block){
  const values={};
  block.split(/\r?\n/).forEach(line=>{const m=line.match(/^\s*(用語|カテゴリ|意味|実務例|関連用語)\s*[:：]\s*(.*)$/);if(!m)return;values[{用語:'name',カテゴリ:'category',意味:'meaning',実務例:'example',関連用語:'related'}[m[1]]]=m[2].trim()});
  if(!values.name||!values.meaning)return null;
  return {id:makeGlossaryId(),name:values.name,category:values.category||'未分類',meaning:values.meaning,example:values.example||'',related:normalizeRelated(values.related),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}
function importGlossaryFromText(){
  const text=glossaryElement.glossaryQuickInput.value.trim();if(!text){glossaryElement.glossaryStatus.textContent='取り込む文章を貼り付けてください。';return}
  const blocks=text.split(/\n\s*(?:---+|===+)\s*\n|\n{2,}(?=\s*用語\s*[:：])/).map(x=>x.trim()).filter(Boolean);
  const imported=blocks.map(parseGlossaryBlock).filter(Boolean);if(!imported.length){glossaryElement.glossaryStatus.textContent='形式を読み取れませんでした。';return}
  const existing=new Set(state.glossary.map(t=>normalizeGlossaryName(t.name)));const added=imported.filter(t=>!existing.has(normalizeGlossaryName(t.name)));
  state.glossary.push(...added);saveState();glossaryElement.glossaryQuickInput.value='';renderGlossary();glossaryElement.glossaryStatus.textContent=`${added.length}語を追加しました。`;
}
function glossaryTemplate(){return ['用語: ','カテゴリ: ','意味: ','実務例: ','関連用語: '].join('\n')}

function registerCatalogMissingTerms(){
  const before=state.glossary.length; migrateGlossaryCatalog(); const count=state.glossary.length-before;
  renderGlossary(); glossaryElement.glossaryStatus.textContent=`${count}語を一括登録しました。`;
}

// events
glossaryElement.toggleGlossaryForm.addEventListener('click',()=>glossaryElement.glossaryForm.classList.contains('is-hidden')?(resetGlossaryForm(),openGlossaryForm()):closeGlossaryForm());
glossaryElement.cancelGlossaryEdit.addEventListener('click',closeGlossaryForm);
glossaryElement.glossaryForm.addEventListener('submit',e=>{e.preventDefault();saveGlossaryFromForm()});
glossaryElement.glossarySearch.addEventListener('input',renderGlossary);
glossaryElement.glossaryCategory.addEventListener('change',renderGlossary);
glossaryElement.importGlossaryText.addEventListener('click',importGlossaryFromText);
glossaryElement.copyGlossaryTemplate.addEventListener('click',async()=>{const t=glossaryTemplate();try{await copyTextToClipboard(t);glossaryElement.glossaryStatus.textContent='追加用テンプレートをコピーしました。'}catch{glossaryElement.glossaryQuickInput.value=t;glossaryElement.glossaryQuickInput.focus()}});
glossaryElement.registerMissingTerms.addEventListener('click',registerCatalogMissingTerms);
glossaryElement.openGlossaryBtn.addEventListener('click',()=>document.getElementById('glossarySection').scrollIntoView({behavior:'smooth',block:'start'}));

glossaryElement.openNewTermsBtn.addEventListener('click',()=>{glossaryElement.glossarySearch.value='';glossaryElement.glossaryCategory.value='';renderGlossary();document.getElementById('recentSection').scrollIntoView({behavior:'smooth',block:'center'});});
glossaryElement.openUnderstandingBtn.addEventListener('click',()=>document.getElementById('understandingSection').scrollIntoView({behavior:'smooth',block:'center'}));
glossaryElement.openReviewBtn.addEventListener('click',()=>document.getElementById('reviewSection').scrollIntoView({behavior:'smooth',block:'center'}));

document.addEventListener('datapath:statechanged', () => { renderGlossary(); });

const migratedCount = migrateGlossaryCatalog();
renderGlossary();
if (migratedCount) glossaryElement.glossaryStatus.textContent = `関連用語を含む${migratedCount}語を初期登録しました。`;
