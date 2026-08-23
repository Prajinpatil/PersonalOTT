import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Sparkles } from 'lucide-react';

export const VideoCard = ({ video, progressSeconds = null }) => {
  if (!video) return null;

  const durationMin = video.durationSeconds
    ? `${Math.floor(video.durationSeconds / 60)}m ${video.durationSeconds % 60}s`
    : 'HD';

  const progressPercentage =
    progressSeconds && video.durationSeconds
      ? Math.min(100, Math.round((progressSeconds / video.durationSeconds) * 100))
      : null;

  return (
    <div className="group relative flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20">
      <Link to={`/watch/${video._id}`} className="block relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-300 flex items-center space-x-1 border border-zinc-800">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>{durationMin}</span>
        </div>

        {/* Watch Progress Bar */}
        {progressPercentage !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-red-600 shadow-sm shadow-red-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </Link>

      {/* Card Info */}
      <div className="p-4">
        <Link to={`/watch/${video._id}`} className="block">
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-red-400 transition-colors truncate">
            {video.title}
          </h3>
        </Link>

        <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-[2rem]">
          {video.description || 'No description available.'}
        </p>

        {/* Genres */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {video.genre?.map((g, idx) => (
            <span
              key={idx}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
