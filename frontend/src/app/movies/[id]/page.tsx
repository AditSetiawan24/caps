import api from "@/lib/api"
import MovieCard from "@/components/ui/MovieCard"
import ReviewForm from "@/components/ReviewForm"
import { Star, Clock, Calendar, MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react"

async function getMovieDetail(id: string) {
  try {
    const res = await api.get(`/movies/detail/${id}`)
    return res.data.data
  } catch (error) {
    console.error(`Failed to fetch movie ${id}:`, error)
    return null
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getMovieDetail(id)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Movie Not Found</h1>
          <p className="text-muted-foreground">The movie you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const { movie, reviews, sentimentDistribution, recommendations } = data
  
  const imageSrc = movie.link_poster && movie.link_poster !== "null" && movie.link_poster !== "undefined"
    ? movie.link_poster 
    : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <div className="relative w-full h-[50vh] md:h-[60vh] flex items-end">
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageSrc} 
            alt={movie.judul_film} 
            className="w-full h-full object-cover object-center opacity-30 blur-sm mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageSrc} 
              alt={movie.judul_film} 
              className="w-48 md:w-64 rounded-2xl shadow-2xl shadow-black/50 border border-white/10 hidden md:block"
            />
            
            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase border border-white/10">
                {movie.genre_utama}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
                {movie.judul_film}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2 text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{movie.skor_rata_rata ? Number(movie.skor_rata_rata).toFixed(1) : "N/A"}</span>
                  <span className="text-white/60 text-xs font-normal">({movie.jumlah_pemberi_skor} votes)</span>
                </div>
                {movie.tanggal_rilis && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(movie.tanggal_rilis).getFullYear()}</span>
                  </div>
                )}
                {movie.durasi_menit && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{movie.durasi_menit} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border/50 pb-2">Overview</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {movie.ringkasan_film || "No synopsis available for this movie."}
              </p>
            </section>

            {/* AI Sentiment Analysis */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">AI Sentiment Analysis</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-2xl text-center space-y-2 border-green-500/20">
                  <div className="mx-auto w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-black text-green-500">{sentimentDistribution?.positif || 0}%</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Positive</p>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center space-y-2 border-gray-500/20">
                  <div className="mx-auto w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center mb-2">
                    <Minus className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-400">{sentimentDistribution?.netral || 0}%</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Neutral</p>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center space-y-2 border-red-500/20">
                  <div className="mx-auto w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-3xl font-black text-red-500">{sentimentDistribution?.negatif || 0}%</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Negative</p>
                </div>
              </div>
            </section>

            {/* User Reviews */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border/50 pb-2">User Reviews ({reviews?.length || 0})</h2>
              
              <div className="space-y-4">
                {reviews?.length > 0 ? (
                  reviews.map((review: any) => (
                    <div key={review.id_review} className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-lg text-primary">
                            {review.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{review.name}</p>
                            <p className="text-xs text-muted-foreground">User Review</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                          review.kategori_sentimen?.toLowerCase() === 'positif' || review.kategori_sentimen?.toLowerCase() === 'positive' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          review.kategori_sentimen?.toLowerCase() === 'negatif' || review.kategori_sentimen?.toLowerCase() === 'negative' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {review.kategori_sentimen}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        "{review.ulasan_pengguna}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No reviews yet for this movie.</p>
                )}
              </div>
            </section>

            {/* Review Form */}
            <section className="space-y-6 pt-6 border-t border-border/50">
              <ReviewForm movieId={data.movie.id_film} />
            </section>
          </div>

          {/* Sidebar - Recommendations */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold border-b border-border/50 pb-2">More Like This</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {recommendations?.length > 0 ? (
                recommendations.map((recMovie: any) => (
                  <MovieCard 
                    key={recMovie.id}
                    id={recMovie.id}
                    title={recMovie.title}
                    rating={recMovie.rating}
                    genres={recMovie.genres}
                    poster_url={recMovie.poster_url}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No recommendations available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
