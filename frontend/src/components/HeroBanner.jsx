import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Sparkles, ShieldCheck } from 'lucide-react';

export const HeroBanner = ({ video }) => {
  if (!video) return null;

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] min-h-[480px] overflow-hidden rounded-b-3xl bg-zinc-950">
      {/* Background Image with Gradients */}
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-full h-full object-cover object-center filter brightness-90 transform scale-105 transition-transform duration-1000"
      />

      {/* Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent w-full md:w-3/4" />

      {/* Hero Content */}
      <div className="absolute bottom-12 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
        <div className="max-w-2xl space-y-4">
          {/* Featured Badge */}
          <div className="inline-flex items-center space-x-2 bg-red-600/20 border border-red-500/40 px-3 py-1 rounded-full backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Featured Premiere</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none drop-shadow-md">
            {video.title}
          </h1>

          {/* Genres & Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded">4K ULTRA HD</span>
            <span className="text-zinc-400">•</span>
            {video.genre?.map((g, idx) => (
              <span key={idx} className="font-medium text-zinc-300">
                {g}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed max-w-xl">
            {video.description}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-4">
            <Link
              to={`/watch/${video._id}`}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Stream Now</span>
            </Link>

            <Link
              to={`/watch/${video._id}`}
              className="flex items-center space-x-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-semibold px-5 py-3 rounded-xl backdrop-blur-md transition-all"
            >
              <Info className="w-5 h-5 text-zinc-400" />
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
