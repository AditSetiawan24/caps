"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "./ui/Button"
import api from "@/lib/api"
import { supabase } from "@/lib/supabase"

interface ReviewFormProps {
  movieId: string | number
}

export default function ReviewForm({ movieId }: ReviewFormProps) {
  const router = useRouter()
  const [review, setReview] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{sentiment: string} | null>(null)
  const [error, setError] = useState("")
  const [session, setSession] = useState<any>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsSessionLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (review.trim().length < 3) {
      setError("Ulasan terlalu pendek (min. 3 karakter).")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await api.post("/reviews", { 
        id_film: movieId,
        ulasan_pengguna: review 
      })
      setResult({ sentiment: res.data.data.kategori_sentimen })
      setReview("")
      
      // Refresh router untuk memuat ulang daftar ulasan
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memproses ulasan.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSessionLoading) {
    return (
      <div className="glass-card p-6 rounded-2xl flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="glass-card p-6 rounded-2xl text-center space-y-4">
        <h3 className="text-xl font-bold">Tambahkan Ulasan</h3>
        <p className="text-sm text-muted-foreground">
          Silakan masuk ke akun Anda terlebih dahulu untuk memberikan ulasan pada film ini.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button>Masuk / Daftar</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 rounded-2xl space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">Tambahkan Ulasan Anda</h3>
        <p className="text-sm text-muted-foreground">
          Berikan ulasan Anda. AI kami akan secara otomatis menganalisis apakah ulasan Anda bersentimen Positif, Netral, atau Negatif.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Film ini sangat luar biasa, saya sangat menyukainya!"
          className="w-full h-32 bg-secondary/50 border border-border/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/70"
        />
        
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        
        {result && (
          <div className={`p-4 rounded-xl border ${
            result.sentiment === 'positif' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
            result.sentiment === 'negatif' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
          }`}>
            <p className="font-bold">Berhasil Disimpan! Deteksi AI: <span className="uppercase tracking-wider">{result.sentiment}</span></p>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Kirim Ulasan
        </Button>
      </form>
    </div>
  )
}
