import Link from "next/link"
import { Film } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-xl mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Film className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">My Film Gweh</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              ini footer ngarang, gak tau mau ngisi apa nanti ubah sendiri yak sesuaikan dengan keyakinan masing-masing.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground/90">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/trending" className="hover:text-primary transition-colors">Trending</Link></li>
              <li><Link href="/genres" className="hover:text-primary transition-colors">Genres</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Watchlist</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground/90">Project</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><span className="text-muted-foreground">Capstone Project</span></li>
              <li><span className="text-muted-foreground">Team CC26-PSU158</span></li>
              <li><span className="text-muted-foreground">Dicoding 2026</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Capstone Project. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
