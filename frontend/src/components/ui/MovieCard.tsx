import Link from "next/link"
import { Star } from "lucide-react"

interface MovieCardProps {
  id: number | string
  title: string
  rating: number
  genres: string
  poster_url?: string | null
}

export default function MovieCard({ id, title, rating, genres, poster_url }: MovieCardProps) {
  // Gunakan placeholder premium jika tidak ada poster
  const imageSrc = poster_url && poster_url !== "null" && poster_url !== "undefined"
    ? poster_url 
    : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop"

  return (
    <Link href={`/movies/${id}`} className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 block aspect-[2/3]">
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity"></div>
      
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute bottom-0 left-0 w-full p-4 z-20 flex flex-col gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <h3 className="font-bold text-lg text-white leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-white">{rating ? Number(rating).toFixed(1) : "N/A"}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 bg-white/10 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm truncate max-w-[100px]">
            {genres?.split(',')[0] || "Movie"}
          </span>
        </div>
      </div>
    </Link>
  )
}
