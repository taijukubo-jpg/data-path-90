'use strict';

/* =========================================================
   DATA PATH v3.1
   - 学習計画
   - 進捗管理
   - 3行レポート
   - 学習ログ
   - 前倒し／遅れ判定
   - 生成AI引き継ぎ
   ========================================================= */

const STORAGE_KEY = 'data-path-local-v2';
const MAX_DAY = 90;

const resource = {
  powerBi: ['Microsoft Learn', 'https://learn.microsoft.com/ja-jp/training/powerplatform/power-bi/'],
  intro: ['Microsoft Learn', 'https://learn.microsoft.com/ja-jp/training/paths/data-analytics-microsoft/'],
  prepare: ['Microsoft Learn', 'https://learn.microsoft.com/ja-jp/training/paths/prepare-data-power-bi/'],
  model: ['Microsoft Learn', 'https://learn.microsoft.com/ja-jp/training/paths/model-data-power-bi/'],
  report: ['Microsoft Learn', 'https://learn.microsoft.com/ja-jp/training/modules/power-bi-effective-reports/'],
  sql: ['SQLBolt', 'https://sqlbolt.com/lesson/'],
  python: ['Kaggle Learn', 'https://www.kaggle.com/learn/python'],
  pandas: ['Kaggle Learn', 'https://www.kaggle.com/learn/pandas'],
  visualization: ['Kaggle Learn', 'https://www.kaggle.com/learn/data-visualization'],
  colab: ['Google Colab', 'https://colab.research.google.com/'],
  git: ['Learn Git Branching', 'https://learngitbranching.js.org/?locale=ja'],
  github: ['GitHub', 'https://github.com/']
};

const element = Object.fromEntries(
  [
    'dayNum', 'homeTodayDay', 'homeTodayText', 'openTodayBtn',
    'homeNextDay', 'homeTaskPreview', 'continueBtn',
    'homeLogTitle', 'homeLogPreview', 'openLogsBtn',
    'completeDays', 'currentDay', 'nextStudyMetric', 'progressStatus',
    'skipCount', 'dateInput', 'addSkip', 'chips', 'recovery',
    'phase', 'focus', 'estimate', 'prev', 'next', 'tasks',
    'report1', 'report2', 'report3', 'saveReport', 'saveStatus',
    'logCount', 'logList',
    'buildAiContext', 'openChatGpt', 'aiContextPreview', 'aiCopyStatus',
    'todayBtn', 'exportBtn', 'importBtn', 'fileInput',
    'copyDayFinish', 'dayFinishStatus'
  ].map((id) => [id, document.getElementById(id)])
);

let state = loadState();
let viewedDay = null;


function createSeedGlossary() {
  return [];
}

/* ------------------------------
   基本ユーティリティ
------------------------------ */

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialState() {
  return {
    startDate: today(),
    completed: {},
    unavailable: [],
    reports: {},
    glossary: createSeedGlossary()
  };
}

function normalizeState(input) {
  const base = createInitialState();

  return {
    startDate: typeof input?.startDate === 'string' ? input.startDate : base.startDate,
    completed: input?.completed && typeof input.completed === 'object' ? input.completed : {},
    unavailable: Array.isArray(input?.unavailable) ? input.unavailable : [],
    reports: input?.reports && typeof input.reports === 'object' ? input.reports : {},
    glossary: Array.isArray(input?.glossary) ? input.glossary : createSeedGlossary()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  document.dispatchEvent(new CustomEvent('datapath:statechanged'));
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );
}

function makeTask(id, type, title, detail, source, url = source[1]) {
  return {
    id,
    type,
    title,
    detail,
    site: source[0],
    url
  };
}

/* ------------------------------
   90日カリキュラム
------------------------------ */

function getPlan(day) {
  if (day <= 3) {
    return {
      phase: 'Power BI',
      focus: 'データ分析とPower BIの全体像',
      items: [
        makeTask(
          'a',
          '公式教材',
          `Microsoft Data Analytics：モジュール ${day}/4`,
          'ラーニングパスを1モジュール修了する',
          resource.intro
        ),
        makeTask(
          'b',
          '実践',
          'Power BI Desktopで学んだ機能を確認',
          '取得・変換・モデル・レポートの位置を確認',
          resource.powerBi
        ),
        makeTask(
          'c',
          '記録',
          '学びを3行で記録',
          '新機能／用途／疑問を各1行',
          resource.powerBi
        )
      ]
    };
  }

  if (day <= 8) {
    return {
      phase: 'Power BI',
      focus: 'データ取得とPower Query',
      items: [
        makeTask(
          'a',
          '公式教材',
          `分析用データの準備：ブロック ${day - 3}/5`,
          '取得→クリーンアップ→モデル選択の順に進める',
          resource.prepare
        ),
        makeTask(
          'b',
          '実践',
          'Excel・CSVを読み込み3つ以上変換',
          '型変更・列分割・ピボット解除を試す',
          resource.prepare
        ),
        makeTask(
          'c',
          '成果物',
          `powerbi-practice-day${day}.pbixを保存`,
          '変換手順名も整理する',
          resource.github
        )
      ]
    };
  }

  if (day <= 16) {
    const topic = [
      'モデル構成',
      'DAX式',
      '計算列とメジャー',
      '反復子関数',
      'フィルターコンテキスト',
      'タイムインテリジェンス',
      'ビジュアル計算',
      'モデル最適化'
    ][day - 9];

    return {
      phase: 'Power BI',
      focus: topic,
      items: [
        makeTask(
          'a',
          '公式教材',
          topic,
          '該当モジュールと知識チェックを完了',
          resource.model
        ),
        makeTask(
          'b',
          '実践',
          '今日のテーマでDAXを3本作成',
          '式・期待値・実際の結果を検算',
          resource.model
        ),
        makeTask(
          'c',
          '記録',
          'DAXメモを保存',
          '実務で使う場面を1つ書く',
          resource.github
        )
      ]
    };
  }

  if (day <= 21) {
    const productionStep = [
      'KPI定義',
      'ワイヤーフレーム',
      'データモデル',
      'KPI可視化',
      '仕上げ・README'
    ][day - 17];

    return {
      phase: 'Power BI',
      focus: 'コールセンターKPIダッシュボード',
      items: [
        makeTask(
          'a',
          '公式教材',
          '効果的なレポート設計',
          'レイアウト・ビジュアル・フィルターを学ぶ',
          resource.report
        ),
        makeTask(
          'b',
          '制作',
          productionStep,
          '架空データで1ページ完成へ進める',
          resource.report
        ),
        makeTask(
          'c',
          '成果物',
          'PBIXと画面画像を保存',
          'GitHub公開用に整理',
          resource.github
        )
      ]
    };
  }

  if (day <= 35) {
    const lesson = Math.min(18, day - 21);

    return {
      phase: 'SQL',
      focus: `SQLBolt Lesson ${lesson}`,
      items: [
        makeTask(
          'a',
          '演習教材',
          `Lesson ${lesson}の全問題`,
          '説明を読み全問正解する',
          resource.sql,
          `${resource.sql[1]}${lesson}`
        ),
        makeTask(
          'b',
          '実践',
          '業務データを想定したSQLを1本作る',
          '問い合わせ履歴への質問をSQL化',
          resource.sql,
          `${resource.sql[1]}${lesson}`
        ),
        makeTask(
          'c',
          '成果物',
          `sql/day-${day}.sqlを保存`,
          'コメント付きでGitHub用に整理',
          resource.github
        )
      ]
    };
  }

  if (day <= 40) {
    const topic = [
      'Hello Python／関数',
      '条件分岐',
      'Lists',
      'Loops',
      'Strings and Dictionaries'
    ][day - 36];

    return {
      phase: 'Python',
      focus: topic,
      items: [
        makeTask(
          'a',
          'Kaggle教材',
          topic,
          'TutorialとExerciseを完了',
          resource.python
        ),
        makeTask(
          'b',
          'Colab実践',
          '見ずに例題を再現',
          'エラーもメモする',
          resource.colab
        ),
        makeTask(
          'c',
          '成果物',
          `python/day-${day}.ipynbを保存`,
          'ノートブックに考察を追加',
          resource.colab
        )
      ]
    };
  }

  if (day <= 49) {
    return {
      phase: 'Python / Pandas',
      focus: 'Pandasデータ処理',
      items: [
        makeTask(
          'a',
          'Kaggle教材',
          `Pandas セクション ${day - 40}/9`,
          'TutorialとExerciseを進める',
          resource.pandas
        ),
        makeTask(
          'b',
          'Colab実践',
          '問い合わせCSVを整形・集計',
          '最低1つ変換し検算',
          resource.colab
        ),
        makeTask(
          'c',
          '成果物',
          'pandas-practice.ipynbを更新',
          '今日の見出しを追加',
          resource.github
        )
      ]
    };
  }

  if (day <= 56) {
    return {
      phase: 'Python / 可視化',
      focus: 'KPIの可視化',
      items: [
        makeTask(
          'a',
          'Kaggle教材',
          `Data Visualization ${day - 49}/7`,
          'TutorialとExerciseを完了',
          resource.visualization
        ),
        makeTask(
          'b',
          '制作',
          'KPIグラフを2種類作成',
          '時間帯別件数・応答率・AHTを候補にする',
          resource.colab
        ),
        makeTask(
          'c',
          '成果物',
          'グラフごとに考察を2行',
          '何が分かるかを記載',
          resource.github
        )
      ]
    };
  }

  if (day <= 63) {
    return {
      phase: 'GitHub',
      focus: 'Gitと成果物公開',
      items: [
        makeTask(
          'a',
          '演習教材',
          `Git学習ブロック ${day - 56}/7`,
          '基本→ブランチ→マージ→公開の順',
          resource.git
        ),
        makeTask(
          'b',
          '実践',
          '変更→コミットを1回実行',
          '意味のあるメッセージを付ける',
          resource.github
        ),
        makeTask(
          'c',
          '成果物',
          'READMEを更新',
          '目的・手順・結果・画像を載せる',
          resource.github
        )
      ]
    };
  }

  const portfolioDay = day - 63;
  const project =
    portfolioDay <= 9
      ? 'Power BI作品'
      : portfolioDay <= 18
        ? 'SQL＋Python作品'
        : '全作品の仕上げ';

  const step = [
    '目的定義',
    'KPI設計',
    '架空データ準備',
    'データ整形',
    '分析実装',
    '可視化',
    '検算と改善',
    'README作成',
    '最終確認'
  ][(portfolioDay - 1) % 9];

  return {
    phase: 'Portfolio',
    focus: project,
    items: [
      makeTask(
        'a',
        '今日の制作',
        step,
        '今日の完了条件まで進める',
        resource.github
      ),
      makeTask(
        'b',
        '品質確認',
        '目的・処理・結果・示唆を説明',
        '第三者に伝わるか確認',
        resource.github
      ),
      makeTask(
        'c',
        '公開',
        `Day ${day}としてコミット`,
        'READMEの進捗も更新',
        resource.github
      )
    ]
  };
}

/* ------------------------------
   進捗計算
------------------------------ */

function currentScheduledDay() {
  const elapsedDays = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(`${state.startDate}T00:00:00`).getTime()) /
        86_400_000
    ) + 1
  );

  const skippedDays = state.unavailable.filter(
    (date) => date >= state.startDate && date <= today()
  ).length;

  return Math.min(
    MAX_DAY,
    Math.max(1, elapsedDays - skippedDays)
  );
}

function activeDay() {
  return viewedDay ?? currentScheduledDay();
}

function taskKey(day, taskId) {
  return `${day}-${taskId}`;
}

function isDayComplete(day) {
  return getPlan(day).items.every(
    (item) => Boolean(state.completed[taskKey(day, item.id)])
  );
}

function consecutiveCompletedDay() {
  let completedDay = 0;

  for (let day = 1; day <= MAX_DAY; day += 1) {
    if (!isDayComplete(day)) break;
    completedDay = day;
  }

  return completedDay;
}

function nextStudyDay() {
  return Math.min(MAX_DAY, consecutiveCompletedDay() + 1);
}

function progressInfo(currentDay) {
  const completedThrough = consecutiveCompletedDay();
  const nextDay = Math.min(MAX_DAY, completedThrough + 1);

  if (completedThrough >= MAX_DAY) {
    return {
      label: '90日完了',
      className: 'status-lead'
    };
  }

  if (nextDay > currentDay) {
    const aheadDays = nextDay - currentDay - 1;

    return aheadDays > 0
      ? {
          label: `${aheadDays}日前倒し`,
          className: 'status-lead'
        }
      : {
          label: '予定どおり',
          className: 'status-on-track'
        };
  }

  if (nextDay < currentDay) {
    return {
      label: `${currentDay - nextDay}日遅れ`,
      className: 'status-delay'
    };
  }

  return {
    label: '予定どおり',
    className: 'status-on-track'
  };
}

function incompletePastDays(currentDay) {
  return Array.from(
    { length: Math.max(0, currentDay - 1) },
    (_, index) => index + 1
  ).filter((day) => !isDayComplete(day));
}

/* ------------------------------
   描画
------------------------------ */

function renderHome(currentDay) {
  const nextDay = nextStudyDay();
  const info = progressInfo(currentDay);
  const todayPlan = getPlan(currentDay);
  const nextPlan = getPlan(nextDay);

  element.homeTodayDay.textContent = `Day ${currentDay}`;
  element.homeTodayText.innerHTML = `
    <b>${escapeHtml(todayPlan.focus)}</b><br>
    <span class="${info.className}">${escapeHtml(info.label)}</span>
  `;

  if (consecutiveCompletedDay() >= MAX_DAY) {
    element.homeNextDay.textContent = '完了';
    element.homeTaskPreview.textContent = '90日分の学習が完了しています。';
    element.continueBtn.disabled = true;
  } else {
    element.homeNextDay.textContent = `Day ${nextDay}`;
    element.homeTaskPreview.innerHTML = `
      <b>${escapeHtml(nextPlan.focus)}</b>
      <ol class="task-preview">
        ${nextPlan.items
          .map((item) => `<li>${escapeHtml(item.title)}</li>`)
          .join('')}
      </ol>
    `;
    element.continueBtn.disabled = false;
  }

  const latestDay = latestReportDay();

  if (latestDay) {
    const report = state.reports[String(latestDay)] ?? {};
    element.homeLogTitle.textContent = `Day ${latestDay}`;
    element.homeLogPreview.textContent =
      report.line1 ||
      report.line2 ||
      report.line3 ||
      '保存済みレポートがあります。';
  } else {
    element.homeLogTitle.textContent = '未記録';
    element.homeLogPreview.textContent =
      '3行レポートを保存すると、最新の学びがここに表示されます。';
  }
}

function renderTasks(day, plan) {
  element.tasks.innerHTML = plan.items
    .map((item) => {
      const key = taskKey(day, item.id);
      const completed = Boolean(state.completed[key]);

      return `
        <div class="task ${completed ? 'done' : ''}">
          <label>
            <input
              type="checkbox"
              data-task-key="${escapeHtml(key)}"
              ${completed ? 'checked' : ''}
            >
            <div>
              <em>${escapeHtml(item.type)}</em>
              <b>${escapeHtml(item.title)}</b>
              <span>${escapeHtml(item.detail)}</span>
            </div>
          </label>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
            <strong>${escapeHtml(item.site)}を開く ↗</strong>
            <code>${escapeHtml(item.url)}</code>
          </a>
        </div>
      `;
    })
    .join('');

  element.tasks
    .querySelectorAll('[data-task-key]')
    .forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        state.completed[checkbox.dataset.taskKey] = checkbox.checked;
        saveState();
        render();
      });
    });
}

function renderUnavailableDays() {
  if (!state.unavailable.length) {
    element.chips.innerHTML = '<small>登録なし</small>';
    return;
  }

  element.chips.innerHTML = state.unavailable
    .map(
      (date) => `
        <button class="chip" type="button" data-unavailable-date="${escapeHtml(date)}">
          ${escapeHtml(date)} ×
        </button>
      `
    )
    .join('');

  element.chips
    .querySelectorAll('[data-unavailable-date]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        state.unavailable = state.unavailable.filter(
          (date) => date !== button.dataset.unavailableDate
        );
        saveState();
        render();
      });
    });
}

function renderRecovery(currentDay) {
  const recoveryDays = incompletePastDays(currentDay);

  if (!recoveryDays.length) {
    element.recovery.innerHTML = `
      <div>
        <b>遅れはありません</b><br>
        <small>現在の予定どおりです。</small>
      </div>
    `;
    return;
  }

  element.recovery.innerHTML = `
    <div>
      <b>未完了 ${recoveryDays.length}日</b><br>
      <small>最優先：Day ${recoveryDays[0]}</small>
    </div>
    <button id="recoverBtn" class="primary" type="button">
      リカバリー開始 →
    </button>
  `;

  document
    .getElementById('recoverBtn')
    .addEventListener('click', () => {
      viewedDay = recoveryDays[0];
      render();
    });
}

function renderReport(day) {
  const report = state.reports[String(day)] ?? {
    line1: '',
    line2: '',
    line3: ''
  };

  element.report1.value = report.line1 ?? '';
  element.report2.value = report.line2 ?? '';
  element.report3.value = report.line3 ?? '';

  element.saveStatus.textContent = report.savedAt
    ? `保存済み：${new Date(report.savedAt).toLocaleString('ja-JP')}`
    : '';
}

function latestReportDay() {
  return (
    Object.keys(state.reports)
      .map(Number)
      .filter((day) => day >= 1 && day <= MAX_DAY)
      .sort((a, b) => b - a)[0] ?? null
  );
}

function renderLogs() {
  const reportDays = Object.keys(state.reports)
    .map(Number)
    .filter((day) => day >= 1 && day <= MAX_DAY)
    .sort((a, b) => b - a);

  element.logCount.textContent = reportDays.length
    ? `${reportDays.length}日分を保存`
    : '保存済み 0日';

  if (!reportDays.length) {
    element.logList.innerHTML = `
      <div class="log-empty">
        3行レポートを保存すると、ここにDayごとの学習ログが表示されます。
      </div>
    `;
    return;
  }

  element.logList.innerHTML = reportDays
    .map((day) => {
      const report = state.reports[String(day)] ?? {};

      return `
        <article class="log-item">
          <div class="log-item-header">
            <b>Day ${day}</b>
            <button type="button" data-log-day="${day}">
              このDayを開く
            </button>
          </div>
          <div class="log-lines">
            <div class="log-line">
              <strong>① 理解：</strong>${escapeHtml(report.line1 || '未記入')}
            </div>
            <div class="log-line">
              <strong>② できた：</strong>${escapeHtml(report.line2 || '未記入')}
            </div>
            <div class="log-line">
              <strong>③ 次に：</strong>${escapeHtml(report.line3 || '未記入')}
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  element.logList
    .querySelectorAll('[data-log-day]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        viewedDay = Number(button.dataset.logDay);
        render();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
}

function render() {
  const scheduledDay = currentScheduledDay();
  const day = activeDay();
  const plan = getPlan(day);
  const info = progressInfo(scheduledDay);

  element.dayNum.textContent = day;
  element.currentDay.textContent = `Day ${scheduledDay}`;
  element.nextStudyMetric.textContent =
    consecutiveCompletedDay() >= MAX_DAY
      ? '完了'
      : `Day ${nextStudyDay()}`;

  element.progressStatus.textContent = info.label;
  element.progressStatus.className = info.className;

  element.completeDays.textContent = `${
    Array.from({ length: MAX_DAY }, (_, index) => index + 1)
      .filter(isDayComplete).length
  }日`;

  element.skipCount.textContent = `${state.unavailable.length}日`;
  element.phase.textContent = plan.phase;
  element.focus.textContent = plan.focus;
  element.estimate.textContent = '目安 2〜4時間';

  element.prev.disabled = day === 1;
  element.next.disabled = day === MAX_DAY;

  renderHome(scheduledDay);
  renderTasks(day, plan);
  renderUnavailableDays();
  renderRecovery(scheduledDay);
  renderReport(day);
  renderLogs();
}


/* ------------------------------
   生成AIへの引き継ぎ
------------------------------ */

function buildAiHandoffText() {
  const scheduledDay = currentScheduledDay();
  const nextDay = nextStudyDay();
  const info = progressInfo(scheduledDay);
  const day = activeDay();
  const plan = getPlan(day);
  const latestDay = latestReportDay();
  const latestReport = latestDay
    ? state.reports[String(latestDay)] ?? {}
    : null;

  const completedTasks = plan.items.filter(
    (item) => state.completed[taskKey(day, item.id)]
  );

  const pendingTasks = plan.items.filter(
    (item) => !state.completed[taskKey(day, item.id)]
  );

  const lines = [
    '【DATA PATH｜学習状況の引き継ぎ】',
    '',
    `今日は予定上 Day ${scheduledDay} です。`,
    consecutiveCompletedDay() >= MAX_DAY
      ? '90日分の学習はすべて完了しています。'
      : `次に優先して取り組むのは Day ${nextDay} です。`,
    `現在の進行状況は「${info.label}」です。`,
    `現在開いている学習内容は Day ${day}「${plan.focus}」です。`,
    '',
    '現在開いているDayのタスク状況：'
  ];

  completedTasks.forEach((task) => {
    lines.push(`・完了：${task.title}`);
  });

  pendingTasks.forEach((task) => {
    lines.push(`・未完了：${task.title}`);
  });

  if (!completedTasks.length && !pendingTasks.length) {
    lines.push('・タスク情報はありません。');
  }

  lines.push('');

  if (latestDay && latestReport) {
    lines.push(`直近の3行レポートは Day ${latestDay} です。`);
    lines.push(
      `① 今日理解したこと：${latestReport.line1 || '未記入'}`
    );
    lines.push(
      `② 今日できるようになったこと：${latestReport.line2 || '未記入'}`
    );
    lines.push(
      `③ 次に学ぶ・試したいこと：${latestReport.line3 || '未記入'}`
    );
  } else {
    lines.push('3行レポートはまだ保存されていません。');
  }

  lines.push(
    '',
    `学習不可日は ${state.unavailable.length} 日登録されています。`,
    '',
    'この内容を現在の学習状況として扱ってください。',
    '現在のDayで必要な範囲を優先し、学習範囲を広げすぎず、実務に結び付けて続きを教えてください。',
    '質問が短い場合も、この引き継ぎ内容と直近の会話から対象を推測してください。'
  );

  return lines.join('\n');
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.left = '-9999px';

  document.body.appendChild(helper);
  helper.select();

  const copied = document.execCommand('copy');

  document.body.removeChild(helper);

  if (!copied) {
    throw new Error('クリップボードへのコピーに失敗しました。');
  }
}

/* ------------------------------
   JSONバックアップ
------------------------------ */

function exportState() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `data-path-progress-${today()}.json`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importState(file) {
  const reader = new FileReader();

  reader.addEventListener('load', () => {
    try {
      state = normalizeState(JSON.parse(reader.result));
      saveState();
      render();
      document.dispatchEvent(new CustomEvent('datapath:statechanged'));
      window.alert('JSONを読み込みました。');
    } catch {
      window.alert('JSONを読み込めませんでした。');
    } finally {
      element.fileInput.value = '';
    }
  });

  reader.readAsText(file);
}

/* ------------------------------
   イベント
------------------------------ */

element.openTodayBtn.addEventListener('click', () => {
  viewedDay = currentScheduledDay();
  render();
  document.querySelector('.focus').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

element.continueBtn.addEventListener('click', () => {
  if (consecutiveCompletedDay() >= MAX_DAY) return;

  viewedDay = nextStudyDay();
  render();
  document.querySelector('.focus').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

element.openLogsBtn.addEventListener('click', () => {
  element.logList.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

element.addSkip.addEventListener('click', () => {
  const date = element.dateInput.value;

  if (
    date &&
    date >= state.startDate &&
    !state.unavailable.includes(date)
  ) {
    state.unavailable.push(date);
    state.unavailable.sort();
    saveState();
    render();
  }
});

element.prev.addEventListener('click', () => {
  viewedDay = Math.max(1, activeDay() - 1);
  render();
});

element.next.addEventListener('click', () => {
  viewedDay = Math.min(MAX_DAY, activeDay() + 1);
  render();
});

element.todayBtn.addEventListener('click', () => {
  viewedDay = null;
  render();
});

element.saveReport.addEventListener('click', () => {
  const day = activeDay();

  state.reports[String(day)] = {
    line1: element.report1.value.trim(),
    line2: element.report2.value.trim(),
    line3: element.report3.value.trim(),
    savedAt: new Date().toISOString()
  };

  saveState();
  renderReport(day);
  renderLogs();
  renderHome(currentScheduledDay());

  element.saveStatus.textContent =
    `Day ${day} のレポートを保存しました。`;
});


element.buildAiContext.addEventListener('click', async () => {
  const text = buildAiHandoffText();
  element.aiContextPreview.value = text;

  try {
    await copyTextToClipboard(text);
    element.aiCopyStatus.textContent =
      '引き継ぎ文を作成し、クリップボードへコピーしました。生成AIの画面へ貼り付けてください。';
  } catch {
    element.aiCopyStatus.textContent =
      '自動コピーに失敗しました。下の文章を選択してコピーしてください。';
    element.aiContextPreview.removeAttribute('readonly');
    element.aiContextPreview.focus();
    element.aiContextPreview.select();
  }
});

element.openChatGpt.addEventListener('click', () => {
  window.open('https://chatgpt.com/', '_blank', 'noopener');
});

element.copyDayFinish.addEventListener('click', async () => {
  const message = `DAY${activeDay()} 学習終了`;
  try {
    await copyTextToClipboard(message);
    element.dayFinishStatus.textContent = `${message} をコピーしました。ChatGPTへ貼り付けてください。`;
  } catch {
    element.dayFinishStatus.textContent = `コピーできませんでした。${message} と入力してください。`;
  }
});

element.exportBtn.addEventListener('click', exportState);

element.importBtn.addEventListener('click', () => {
  element.fileInput.click();
});

element.fileInput.addEventListener('change', () => {
  const [file] = element.fileInput.files;
  if (file) importState(file);
});

/* ------------------------------
   起動
------------------------------ */

element.dateInput.value = today();
render();
