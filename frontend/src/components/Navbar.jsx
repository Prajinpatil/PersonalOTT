import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Search, User, LogOut, ShieldAlert, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 shadow-2xl py-3'
          : 'bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
              Personal<span className="text-red-500">OTT</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/search' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Browse & Search
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors flex items-center space-x-1.5 px-3 py-1 rounded-full border ${
                  location.pathname === '/admin'
                    ? 'border-red-500/80 bg-red-500/10 text-red-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <span>Admin Studio</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Search Bar & Auth Menu */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Titles, genres, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 rounded-full pl-9 pr-4 py-2 w-48 lg:w-64 border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-red-400 border border-zinc-700">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-zinc-200 hidden sm:inline">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="bg-red-950 text-red-400 text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-600/20 transition-all transform hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
