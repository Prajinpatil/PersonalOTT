import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import VideoPlayer from '../components/VideoPlayer';
import VideoCard from '../components/VideoCard';
import { ArrowLeft, Clock, Calendar, UserCheck, ShieldCheck, Film } from 'lucide-react';

export const WatchPage = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [videoRes, catalogRes] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get('/videos'),
        ]);

        const currentVideo = videoRes.data.video;
        setVideo(currentVideo);

        // Filter out current video for related section
        const allVideos = catalogRes.data.videos || [];
        const related = allVideos.filter((v) => v._id !== id);
        setRelatedVideos(related);
      } catch (err) {
        setError(err.response?.data?.error || 'Video details not found');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-6">
        <div className="w-full aspect-video bg-zinc-900 animate-pulse rounded-2xl" />
        <div className="h-8 bg-zinc-900 animate-pulse rounded w-1/3" />
        <div className="h-4 bg-zinc-900 animate-pulse rounded w-1/2" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2">Video Unavailable</h2>
        <p className="text-zinc-400 text-sm mb-6">{error || 'The requested video could not be loaded.'}</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-red-600 text-white font-semibold text-sm px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const durationMin = video.durationSeconds
    ? `${Math.floor(video.durationSeconds / 60)} minutes ${video.durationSeconds % 60} seconds`
    : 'HD Standard';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Browse</span>
          </Link>
        </div>

        {/* Video Player */}
        <VideoPlayer videoId={video._id} title={video.title} />

        {/* Video Details & Meta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {video.title}
              </h1>

              {/* Genre Pills & Attributes */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold px-2.5 py-1 rounded-md">
                  R2 Cloud Streamed
                </span>
                {video.genre?.map((g, idx) => (
                  <span
                    key={idx}
                    className="bg-zinc-900 text-zinc-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-zinc-800"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Synopsis & Details</h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {video.description || 'No description provided for this title.'}
              </p>

              <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Duration: {durationMin}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>Added: {new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-red-500" />
                  <span>Publisher: {video.uploadedBy?.name || 'OTT Admin'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Recommendations Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Film className="w-5 h-5 text-red-500" />
              <span>More Titles You Might Like</span>
            </h3>

            <div className="space-y-4">
              {relatedVideos.slice(0, 4).map((relVideo) => (
                <div key={relVideo._id} className="flex justify-center">
                  <VideoCard video={relVideo} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
