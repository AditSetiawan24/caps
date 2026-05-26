"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Film, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import api from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // 1. Sign up di Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (authError) throw authError

      if (data.session) {
        // 2. Sinkronisasi data profile ke Postgres backend jika langsung login
        await api.get("/users/check-profile")
        router.push("/")
        router.refresh()
      } else {
        // 3. Supabase meminta verifikasi email
        setError("Pendaftaran berhasil! Silakan periksa kotak masuk (inbox) Email Anda untuk link konfirmasi sebelum login.")
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Gagal mendaftar. Silakan coba lagi.";
      setError(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-3xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Film className="w-8 h-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">My Film Gweh</span>
          </Link>
          <h2 className="text-3xl font-bold">Buat Akun Baru</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Nama Lengkap</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nama Anda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Minimal 6 karakter"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full py-6 text-md font-bold">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Daftar
          </Button>
        </form>
      </div>
    </div>
  )
}
