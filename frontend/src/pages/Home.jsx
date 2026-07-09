import { useEffect, useState } from 'react';
import { useMovies } from '../hooks/useMovies';
import { fetchRecommendedMovies, fetchTopRatedMovies, fetchTrendingNepaliMovies } from '../services/movieApi';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SectionHeader from '../components/SectionHeader';
import FilmRow from '../components/FilmRow';
import PromoBanner from '../components/PromoBanner';
import MiniCard from '../components/MiniCard';

function Home() {
  const { user } = useAuthContext();
  const { popular, recent, loading } = useMovies();
  const [recommended, setRecommended] = useState(null);
  const [topRated, setTopRated] = useState([]);
  const [nepali, setNepali] = useState([]);

  useEffect(() => {
    fetchTopRatedMovies().then(setTopRated).catch(() => {});
    fetchTrendingNepaliMovies().then(setNepali).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecommendedMovies()
        .then((data) => setRecommended(data?.movies || data || []))
        .catch(() => {});
    } else {
      setRecommended(null);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />

        <main className="space-y-8 pt-6">
          {user && recommended && recommended.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="RECOMMENDED FOR YOU" actionText="MORE" actionTo="/search" />
              <FilmRow films={recommended} loading={false} />
            </section>
          )}

          <section className="space-y-4">
            <SectionHeader title="POPULAR FILMS" actionText="MORE" actionTo="/search" />
            <FilmRow films={popular} loading={loading} />
          </section>

          <section className="space-y-4">
            <SectionHeader title="TOP RATED" actionText="MORE" actionTo="/search" />
            <FilmRow films={topRated} loading={topRated.length === 0} />
          </section>

          {nepali.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="TRENDING NEPALI MOVIES" actionText="MORE" actionTo="/search" />
              <FilmRow films={nepali} loading={false} />
            </section>
          )}

          <PromoBanner />

          <section className="space-y-4">
            <SectionHeader title="JUST REVIEWED" actionText="VIEW ALL" actionTo="/search" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[280px] animate-pulse rounded-3xl bg-surface3" />
                  ))
                : recent.map((film) => <MiniCard key={film.id} film={film} />)}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Home;
