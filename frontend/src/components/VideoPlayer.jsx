import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../api/client';

export const VideoPlayer = ({ videoId, title }) => {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [initialSeekDone, setInitialSeekDone] = useState(false);
  const lastSavedTimeRef = useRef(0);

  // 1. Fetch pre-signed GET streaming URL from backend
  useEffect(() => {
    let isMounted = true;

    const fetchStreamUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/videos/${videoId}/stream-url`);
        if (isMounted) {
          setStreamUrl(res.data.streamUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to obtain video stream ticket');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStreamUrl();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  // 2. Fetch saved Watch Progress on initial mount & set seek position
  useEffect(() => {
    if (!videoId) return;

    const fetchProgress = async () => {
      try {
        const res = await api.get(`/progress/${videoId}`);
        if (res.data.seconds > 5 && videoRef.current && !initialSeekDone) {
          videoRef.current.currentTime = res.data.seconds;
          setCurrentTime(res.data.seconds);
          setInitialSeekDone(true);
          console.log(`[VideoPlayer] Auto-resumed playback from ${res.data.seconds}s`);
        }
      } catch (err) {
        console.warn('Failed to fetch initial watch progress', err);
      }
    };

    fetchProgress();
  }, [videoId, streamUrl]);

  // 3. Periodic WatchProgress Sync Handler (throttled to every 5 seconds)
  const saveProgressThrottled = async (timeInSeconds) => {
    if (Math.abs(timeInSeconds - lastSavedTimeRef.current) < 5) return;

    lastSavedTimeRef.current = timeInSeconds;
    try {
      await api.post(`/progress/${videoId}`, { seconds: Math.floor(timeInSeconds) });
    } catch (err) {
      console.warn('Failed to save progress', err);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      saveProgressThrottled(cur);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      saveProgressThrottled(seekTime);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex flex-col items-center justify-center border border-zinc-800">
        <RefreshCw className="w-10 h-10 text-red-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-300">Generating Secure Stream Ticket...</p>
        <p className="text-xs text-zinc-500 mt-1">Establishing direct Cloudflare R2 byte-range tunnel</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-zinc-900/90 rounded-2xl flex flex-col items-center justify-center border border-red-900/40 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Playback Stream Error</h3>
        <p className="text-sm text-zinc-400 max-w-md mt-1 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Retry Stream
        </button>
      </div>
    );
  }

  return (
    <div className="relative group w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
      {/* HTML5 Video Element streaming directly from R2 via pre-signed GET URL */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controlsList="nodownload"
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Video Control Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none">
        {/* Top Header */}
        <div className="pointer-events-auto">
          <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-md truncate">
            {title}
          </h3>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-2 pointer-events-auto">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-red-500 transition-colors p-1"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="text-zinc-300 hover:text-white transition-colors p-1"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-xs font-mono text-zinc-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-zinc-300 hover:text-white transition-colors p-1"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
