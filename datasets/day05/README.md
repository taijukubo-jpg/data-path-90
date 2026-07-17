# DATA PATH Day5｜Power Query練習用データ

## ファイル
- 問い合わせ履歴.csv
- 担当者マスタ.csv
- 問い合わせ種別.csv

## Power BIへの取り込み
1. Power BI Desktopを開く
2. Home → Get data → Text/CSV
3. 問い合わせ履歴.csvを選択
4. LoadではなくTransform Dataを選択
5. Power Query Editorで Home → New Source → Text/CSV から残り2ファイルも追加

## 意図的に含めたデータ品質問題
- 担当者IDの末尾空白
- 担当者IDの小文字
- 顧客満足度の空欄
- AHTの異常値 9999
- 待ち時間の「○秒」文字列混在
- 日付表記の違い
- 問い合わせ履歴の重複行

## Day5の学習項目
- Column Quality
- Column Distribution
- Column Profile
- データ型変更
- Trim / Clean
- Replace Values
- Remove Duplicates
- Merge Queries
- Close & Apply
