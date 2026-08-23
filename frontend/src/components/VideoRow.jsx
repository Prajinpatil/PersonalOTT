import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';

export const VideoRow = ({ title, videos = [], progressMap = {} }) => {
  const rowRef = useRef(null);

  if (!videos || videos.length === 0) return null;

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="my-8 relative group/row">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
          <span>{title}</span>
        </h2>
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all hover:bg-red-600 hover:border-red-500 shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Carousel Row */}
        <div
          ref={rowRef}
          className="flex space-x-5 overflow-x-auto no-scrollbar py-2 scroll-smooth"
        >
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              progressSeconds={progressMap[video._id]}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all hover:bg-red-600 hover:border-red-500 shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};

export default VideoRow;
