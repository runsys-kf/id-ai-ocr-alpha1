"use client"

import { useState } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function HealthCardScanner() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState({
    name: '',
    birthdate: '',
    gender: '',
    insuranceNumber: '',
    symbolNumber: '',
    expirationDate: '',
    healthInsuranceType: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return
  
    setIsLoading(true)
  
    const formData = new FormData()
    formData.append('image', file)
  
    try {
      const response = await axios.post('/api/analyze_image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
  
      setResults({
        name: response.data.name || '',
        birthdate: response.data.birthdate || '',
        gender: response.data.gender || '',
        insuranceNumber: response.data.insuranceNumber || '',
        symbolNumber: response.data.symbolNumber || '',
        expirationDate: response.data.expirationDate || '',
        healthInsuranceType: response.data.healthInsuranceType || ''
      })
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsLoading(false) // 処理の成功・失敗に関わらず必ずローディングを終了する
    }
  }
  

  return (
    <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>健康保険証スキャナー</CardTitle>
      <CardDescription>健康保険証の画像をアップロードしてください</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit}>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="image">画像</Label>
            <Input id="image" type="file" onChange={handleFileChange} accept="image/*" />
          </div>
          <Button type="submit" disabled={!file || isLoading}>
            {isLoading ? '処理中...' : '画像を解析'}
          </Button>
        </div>
      </form>
    </CardContent>
    <CardFooter>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="name">氏名（フルネーム）</Label>
          <Input id="name" value={results.name} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="birthdate">生年月日</Label>
          <Input id="birthdate" value={results.birthdate} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="gender">性別</Label>
          <Input id="gender" value={results.gender} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="insuranceNumber">保険者番号</Label>
          <Input id="insuranceNumber" value={results.insuranceNumber} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="symbolNumber">記号・番号</Label>
          <Input id="symbolNumber" value={results.symbolNumber} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="expirationDate">有効期限</Label>
          <Input id="expirationDate" value={results.expirationDate} readOnly />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="healthInsuranceType">健康保険の種類</Label>
          <Input id="healthInsuranceType" value={results.healthInsuranceType} readOnly />
        </div>
      </div>
    </CardFooter>
  </Card>
  )
}