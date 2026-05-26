import { Suspense } from "react"
import api from "@/lib/api"
import MovieCard from "@/components/ui/MovieCard"
import { Search } from "lucide-react"

async function SearchResults({ query }: { query: string }) {
  try {
    const res = await api.get(`/movies?search=${encodeURIComponent(query)}&limit=20`)
    const movies = res.data.data

    if (!movies || movies.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-2">Pencarian Tidak Ditemukan</h3>
          <p className="text-muted-foreground">Maaf, kami tidak dapat menemukan film dengan judul "{query}".</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie: any) => (
          <MovieCard
            key={movie.id_film}
            id={movie.id_film}
            title={movie.judul_film}
            poster_url={movie.link_poster}
            rating={movie.skor_rata_rata}
            genres={movie.genre_utama}
          />
        ))}
      </div>
    )
  } catch (error) {
    return (
      <div className="text-center py-20 text-red-500">
        Terjadi kesalahan saat mencari film. Pastikan server backend Anda menyala.
      </div>
    )
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || ""

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Hasil Pencarian</h1>
          <p className="text-muted-foreground">Menampilkan hasil untuk: <span className="text-foreground font-semibold">"{query}"</span></p>
        </div>
      </div>
      
      <Suspense fallback={<div className="text-center py-20">Mencari film...</div>}>
        {query ? <SearchResults query={query} /> : <div className="text-center py-20">Silakan masukkan judul film di kolom pencarian.</div>}
      </Suspense>
    </div>
  )
}
