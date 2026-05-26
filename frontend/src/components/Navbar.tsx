"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Film, Search, User, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }
  return (
    <nav className="glass sticky top-0 z-50 w-full transition-all duration-300">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            My Film Gweh
          </span>
        </Link>
        
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul film..." 
            className="w-full bg-secondary/50 border border-border/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/80 transition-all placeholder:text-muted-foreground/70"
          />
        </form>

        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </button>
          {session ? (
            <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-red-500/10 p-2 md:px-4 md:py-2 rounded-full transition-colors border border-transparent hover:border-red-500/20 text-red-500">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:block">Logout</span>
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-2 hover:bg-secondary/80 p-2 md:px-4 md:py-2 rounded-full transition-colors border border-transparent hover:border-border/50">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium hidden md:block text-muted-foreground">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
