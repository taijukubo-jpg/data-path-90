# DATA PATH v2.0

90日間のデータアナリスト学習を管理する、GitHub Pages向けの静的Webアプリです。

## ファイル構成

```text
data-path-90/
├─ index.html   # 画面構造
├─ styles.css   # デザイン
├─ app.js       # 学習計画・進捗管理・ログ・AI連携
└─ README.md    # 説明書
```

## 主な機能

- 日付を基準にした今日のDay表示
- 学習不可日の除外
- Dayごとのタスク管理
- 前倒し／遅れの判定
- 3行レポート
- 学習ログ一覧
- 生成AI向け引き継ぎ文の作成とコピー
- JSONバックアップ／復元

## GitHubへの反映

### 初回

リポジトリ直下へ、次の4ファイルをアップロードします。

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

### 既存ファイルとの関係

- `index.html`：既存ファイルを差し替え
- `README.md`：既存ファイルを差し替え
- `styles.css`：新規追加
- `app.js`：新規追加

最終的なリポジトリ直下は次の状態です。

```text
README.md
app.js
index.html
styles.css
```

## 更新確認

GitHub Pagesへ反映後、次のURLを開きます。

```text
https://taijukubo-jpg.github.io/data-path-90/
```

古い画面が表示される場合は、Windowsで次を実行します。

```text
Ctrl + Shift + R
```

## 生成AI連携のテスト

1. DATA PATHを開く
2. 「引き継ぎ文を作成してコピー」を押す
3. メモ帳などへ貼り付ける
4. 次の文字から始まれば成功

```text
【DATA PATH｜学習状況の引き継ぎ】
```

## データ保存

進捗データはブラウザの `localStorage` に保存されます。

ブラウザの初期化やPC変更に備えて、週1回を目安にJSONをエクスポートしてください。
