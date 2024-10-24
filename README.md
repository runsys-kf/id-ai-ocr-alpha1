# 身分証明書AI-OCR

身分証明書の画像をアップロードすることで、記載されている内容を構造的に抽出するWEBアプリ

## 対応証明書
以下の各種証明書に対応
- 運転免許証
- マイナンバーカード
- 健康保険証（対応済み）
- パスポート

## 対応画像ファイル
アップロード可能な画像ファイルの拡張子は、クライアントが指定する形式に依存する。
主に以下のファイル形式に対応しています：
- `.png`
- `.jpg`

## API
Google Generative AI
- [Google Generative AI ドキュメント](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference?hl=ja)

## プロンプト
```
    ### 命令
    この健康診断カードから以下の情報を抽出してください：名前、生年月日、性別、保険者番号、記号・番号、有効期限、健康保険の種類
    性別の項目は画像から判断してください。出力例：女性（AIによる判断）
    ### 制約
    ・下記の【JSONデータフォーマット】のみを出力すること
    ・JSONという文字も出力しないこと
    ・JSONデータ以外のテキストを絶対に出力しないこと
    ・項目の値が抽出できない場合は空文字列として出力すること
    ### JSONデータフォーマット
    {
        name: '',
        birthdate: '',
        gender: '',
        insuranceNumber: '',
        symbolNumber: '',
        expirationDate: '',
        healthInsuranceType: '',
    }
```
