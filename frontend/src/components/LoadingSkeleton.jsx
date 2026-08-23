import React from 'react';

export const CardSkeleton = () => (
  <div className="flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 animate-pulse">
    <div className="w-full aspect-video bg-zinc-800" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800/60 rounded w-full" />
      <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
      <div className="pt-2 flex space-x-2">
        <div className="h-3 bg-zinc-800 rounded w-12" />
        <div className="h-3 bg-zinc-800 rounded w-12" />
      </div>
    </div>
  </div>
);

export const RowSkeleton = ({ title = 'Loading Videos...' }) => (
  <div className="my-8 px-4 sm:px-6 lg:px-8 space-y-4">
    <div className="h-6 bg-zinc-800 rounded w-48 animate-pulse" />
    <div className="flex space-x-5 overflow-x-hidden">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default CardSkeleton;
