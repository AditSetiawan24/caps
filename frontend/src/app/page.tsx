import HeroSection from "@/components/ui/HeroSection"
import MovieCard from "@/components/ui/MovieCard"
import api from "@/lib/api"
import { Film, TrendingUp, Star } from "lucide-react"

async function getMovies(sortBy = "popularity", limit = 10) {
  try {
    const res = await api.get(`/movies?sort_by=${sortBy}&limit=${limit}`)
    return res.data.data || []
  } catch (error) {
    console.error(`Failed to fetch ${sortBy} movies:`, error)
    return []
  }
}

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const trendingMovies = await getMovies("popularity", 10)
  const topRatedMovies = await getMovies("rating", 10)

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* Trending Section */}
        <section id="trending" className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <TrendingUp className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Trending</h2>
              <p className="text-muted-foreground text-sm mt-1">MBG (Mas Bahlil Ganteng)</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trendingMovies.map((movie: any) => (
              <MovieCard 
                key={movie.id_film}
                id={movie.id_film}
                title={movie.judul_film}
                rating={movie.skor_rata_rata}
                genres={movie.genre_utama}
                poster_url={movie.link_poster}
              />
            ))}
            {trendingMovies.length === 0 && (
              <p className="text-muted-foreground col-span-full py-10 text-center">Belum ada film trending.</p>
            )}
          </div>
        </section>

        {/* Top Rated Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Rating Tertinggi</h2>
              <p className="text-muted-foreground text-sm mt-1">Hidup Jokowi</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {topRatedMovies.map((movie: any) => (
              <MovieCard 
                key={movie.id_film}
                id={movie.id_film}
                title={movie.judul_film}
                rating={movie.skor_rata_rata}
                genres={movie.genre_utama}
                poster_url={movie.link_poster}
              />
            ))}
            {topRatedMovies.length === 0 && (
              <p className="text-muted-foreground col-span-full py-10 text-center">Belum ada film dengan rating tertinggi.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
