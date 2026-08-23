import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-6">
        <Film className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-6xl font-extrabold text-white tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-zinc-300 mt-2 mb-3">Page Not Found</h2>
      <p className="text-sm text-zinc-400 max-w-md mb-8">
        The title or stream URL you are attempting to reach does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all transform hover:scale-105"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home Catalog</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
