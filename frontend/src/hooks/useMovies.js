import { useEffect, useState } from 'react';
import { fetchNowPlayingMovies, fetchPopularMovies } from '../services/movieApi';

export function useMovies() {
  const [popular, setPopular] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [popularData, recentData] = await Promise.all([
          fetchPopularMovies(),
          fetchNowPlayingMovies()
        ]);
        setPopular(popularData);
        setRecent(recentData.slice(0, 12));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { popular, recent, loading, error };
}
