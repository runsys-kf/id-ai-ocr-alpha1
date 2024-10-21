import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import dotenv from 'dotenv';

export const config = {
  api: {
    bodyParser: false,
  },
};

dotenv.config();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  const form = formidable({
    multiples: false,      // 複数ファイルアップロードを許可しない
    keepExtensions: true,  // ファイルの拡張子を保持
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('ファイルのアップロード中にエラーが発生しました:', err);
      return res.status(500).json({ error: 'ファイルのアップロードに失敗しました' });
    }

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!file) {
      return res.status(400).json({ error: '画像ファイルが選択されていません' });
    }

    // コピー先のディレクトリを作成する
    // const uploadDir = path.join(process.cwd(), 'uploads');
    const uploadDir = '/tmp';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // ディレクトリがない場合は再帰的に作成
    }

    // コピー元ファイルが存在するか確認
    if (!fs.existsSync(file.filepath)) {
      return res.status(400).json({ error: 'アップロードされたファイルが見つかりません' });
    }

    // ファイルを一時ディレクトリから安全な場所にコピー
    const tempPath = file.filepath;
    const targetPath = path.join(uploadDir, file.originalFilename || 'uploaded_image.png');
    // ファイルをコピー
    fs.copyFileSync(tempPath, targetPath);

    // コピーしたファイルを読み込む
    // const imageBuffer = fs.readFileSync(targetPath);

    // GoogleAIFileManager の初期化
    const fileManager = new GoogleAIFileManager(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

    // ファイルのアップロード
    // const uploadResponse = await fileManager.uploadFile(file.originalFilename || 'uploaded_image', {
    const uploadResponse = await fileManager.uploadFile(targetPath, { 
    mimeType: file.mimetype || 'image/png', // ここをjpegからpngに修正
    displayName: 'Uploaded health card image',
    });

    // GoogleGenerativeAI の初期化
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

    // モデルの取得
    const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    });

    // モデルを使用してコンテンツを生成
    const result = await model.generateContent([
    {
        fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri,
        },
    },
    {
        text: `
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
            }`,
    },
    ]);
    // 結果の解析
    const analysisText = await result.response.text();
    const extractedData = extractRelevantData(analysisText); // 必要なデータを抽出する処理    

    // 成功レスポンス
    res.status(200).json(extractedData);
  });
}

// 必要な情報を抽出する関数
function extractRelevantData(analysisText: string) {
    try {
      // JSON形式の文字列をオブジェクトに変換
      const data = JSON.parse(analysisText);
  
      // 解析結果からデータを抽出し、returnする
      return {
        name: data.name || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        insuranceNumber: data.insuranceNumber || '',
        symbolNumber: data.symbolNumber || '',
        expirationDate: data.expirationDate || '',
        healthInsuranceType: data.healthInsuranceType || '',
      };
    } catch (error) {
      console.error('JSON解析中にエラーが発生しました:', error);
      return {
        name: '',
        birthdate: '',
        gender: '',
        insuranceNumber: '',
        symbolNumber: '',
        expirationDate: '',
        healthInsuranceType: '',
      };
    }
  }
