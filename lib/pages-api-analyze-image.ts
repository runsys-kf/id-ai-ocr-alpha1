import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleAIFileManager } from "@google/generative-ai/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const form = new formidable.IncomingForm()
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'ファイルのアップロードに失敗しました' })
    }

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!file) {
      return res.status(400).json({ error: '画像ファイルが選択されていません' });
    }

    try {
      // Initialize GoogleAIFileManager with your API_KEY
      const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY as string)

      // Upload the file
      const uploadResponse = await fileManager.uploadFile(file.originalFilename || 'uploaded_image', {
        mimeType: file.mimetype || 'image/png',
        displayName: "Uploaded health card image",
      })

      // Initialize GoogleGenerativeAI with your API_KEY
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
      })

      // Generate content using text and the URI reference for the uploaded file
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri
          }
        },
        { text: "この健康診断カードから以下の情報を抽出してください：名前、生年月日、身長、体重、血液型。日本語で回答してください。" },
      ])

      const analysis = result.response.text()

      res.status(200).json({ analysis })
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: '画像の処理中にエラーが発生しました' })
    }
  })
}