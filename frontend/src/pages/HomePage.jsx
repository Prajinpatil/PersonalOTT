import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import HeroBanner from '../components/HeroBanner';
import VideoRow from '../components/VideoRow';
import { RowSkeleton } from '../components/LoadingSkeleton';
import { Sparkles, Film, Compass } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preferred Genre Display Order
  const PRIMARY_GENRES = ['Horror', 'Sci-Fi', 'Comedy', 'Thriller'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const videosRes = await api.get('/videos?limit=50');
        setVideos(videosRes.data.videos || []);

        if (user) {
          try {
            const progressRes = await api.get('/progress');
            setProgressList(progressRes.data.progress || []);
          } catch (pErr) {
            console.warn('Could not fetch user watch progress', pErr);
          }
        }
      } catch (err) {
        setError('Failed to load streaming catalog. Please check server connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Map progress by video ID
  const progressMap = progressList.reduce((acc, curr) => {
    if (curr.videoId && curr.videoId._id) {
      acc[curr.videoId._id] = curr.seconds;
    } else if (curr.videoId) {
      acc[curr.videoId] = curr.seconds;
    }
    return acc;
  }, {});

  // Extract continue watching videos
  const continueWatchingVideos = progressList
    .map((p) => p.videoId)
    .filter((v) => v && typeof v === 'object');

  // Featured Hero Video (first video or fallback)
  const heroVideo = videos.length > 0 ? videos[0] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Featured Hero Banner */}
      {loading ? (
        <div className="w-full h-[60vh] bg-zinc-900 animate-pulse flex items-center justify-center">
          <p className="text-zinc-500 font-medium text-sm">Loading Premium Catalog...</p>
        </div>
      ) : heroVideo ? (
        <HeroBanner video={heroVideo} />
      ) : null}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 space-y-10 mt-6">
        {loading ? (
          <>
            <RowSkeleton title="Continue Watching" />
            <RowSkeleton title="Horror Cinema" />
            <RowSkeleton title="Sci-Fi Thrillers" />
            <RowSkeleton title="Comedy Blockbusters" />
          </>
        ) : error ? (
          <div className="p-8 my-12 bg-zinc-900 border border-red-900/40 rounded-2xl text-center max-w-lg mx-auto">
            <Compass className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Catalog Unavailable</h3>
            <p className="text-sm text-zinc-400 mt-1 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-500"
            >
              Reload Catalog
            </button>
          </div>
        ) : (
          <>
            {/* Continue Watching Section */}
            {user && continueWatchingVideos.length > 0 && (
              <VideoRow
                title="Continue Watching"
                videos={continueWatchingVideos}
                progressMap={progressMap}
              />
            )}

            {/* Main Catalog / Top Trending */}
            <VideoRow
              title="Top Trending Releases"
              videos={videos}
              progressMap={progressMap}
            />

            {/* 4 Primary Platform Genre Rows */}
            {PRIMARY_GENRES.map((genre) => {
              const genreVideos = videos.filter((v) => v.genre?.includes(genre));
              if (genreVideos.length === 0) return null;

              return (
                <VideoRow
                  key={genre}
                  title={`${genre} Spotlight`}
                  videos={genreVideos}
                  progressMap={progressMap}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
