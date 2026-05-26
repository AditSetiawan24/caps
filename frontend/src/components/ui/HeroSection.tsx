import Link from "next/link"
import { Play, Info } from "lucide-react"

export default function HeroSection() {
  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center">
      {/* Background with overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop" 
          alt="Hero background" 
          className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
          <div className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-bold tracking-widest uppercase mb-2">
            Platform Rekomendasi No. 1
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
            Buah apa? Yang paling manis <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
              BUAAAHLILLLL.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
            Tambah ganteng aja My little bolu ketan Ups kanda suka dinda punya gaya Sialan dia Makin lucu guys Kalau diperhatiin lama-lama mirip ZAYN MALIK.
          </p>
          
          <div className="flex items-center gap-4 pt-4">
            <Link href="#trending" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25">
              <Play className="w-5 h-5 fill-current" />
              Tombol Ajah
            </Link>
            <Link href="#trending" className="glass hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 transition-all hover:border-white/20">
              <Info className="w-5 h-5" />
              Tombol 2 (gatau buat apaan)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
