import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import VideoCard from '../components/VideoCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { Search, Filter, Sparkles, AlertTriangle } from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const GENRES = ['All', 'Sci-Fi', 'Action', 'Animation', 'Comedy', 'Documentary', 'Drama', 'Fantasy'];

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (query.trim()) params.search = query.trim();
        if (selectedGenre && selectedGenre !== 'All') params.genre = selectedGenre;

        const res = await api.get('/videos', { params });
        setVideos(res.data.videos || []);
      } catch (err) {
        setError('Search query failed. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchVideos, 300);
    return () => clearTimeout(timer);
  }, [query, selectedGenre]);

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
    setSearchParams((prev) => {
      if (genre === 'All') prev.delete('genre');
      else prev.set('genre', genre);
      return prev;
    });
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchParams((prev) => {
      if (!val.trim()) prev.delete('q');
      else prev.set('q', val);
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Title Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Search className="w-8 h-8 text-red-500" />
            <span>Search & Explore Catalog</span>
          </h1>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search by title, description, keywords..."
              value={query}
              onChange={handleQueryChange}
              className="w-full bg-zinc-900 text-zinc-100 placeholder-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-base shadow-xl"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Genre Tag Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2">
            <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0 mr-1" />
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedGenre === g
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {loading
              ? 'Searching database...'
              : `Found ${videos.length} title${videos.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="p-8 bg-zinc-900 border border-red-900/40 rounded-2xl text-center max-w-md mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-zinc-300 text-sm">{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl max-w-lg mx-auto">
            <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Matching Titles Found</h3>
            <p className="text-zinc-400 text-sm px-4">
              Try adjusting your query terms or selecting another genre category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-start">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
