import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/client';
import {
  UploadCloud,
  Film,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  Database,
  Cloud,
  Trash2,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genreInput, setGenreInput] = useState('Sci-Fi, Action');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(300);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'requesting_url' | 'uploading_r2' | 'saving_metadata' | 'done'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Existing videos state
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const fetchExistingVideos = async () => {
    try {
      const res = await api.get('/videos');
      setVideos(res.data.videos || []);
    } catch (err) {
      console.warn('Failed to load existing videos list', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchExistingVideos();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Auto-extract filename if title empty
      if (!title) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title || !thumbnailUrl) {
      setError('Title and Thumbnail URL are required');
      return;
    }

    try {
      let finalVideoKey = '';

      if (selectedFile) {
        // Step 1: Request pre-signed R2 PUT URL from Express
        setUploadStatus('requesting_url');
        const presignedRes = await api.post('/videos/upload-url', {
          fileName: selectedFile.name,
          fileType: selectedFile.type || 'video/mp4',
        });

        const { uploadUrl, videoKey, isMock } = presignedRes.data;
        finalVideoKey = videoKey;

        // Step 2: Upload file directly to Cloudflare R2 via pre-signed PUT URL
        setUploadStatus('uploading_r2');
        await axios.put(uploadUrl, selectedFile, {
          headers: {
            'Content-Type': selectedFile.type || 'video/mp4',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });
      } else {
        // Fallback demo video key or URL input
        finalVideoKey = `videos/demo-${Date.now()}.mp4`;
      }

      // Step 3: Save video metadata in MongoDB Atlas
      setUploadStatus('saving_metadata');
      const genreList = genreInput
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      await api.post('/videos', {
        title,
        description,
        genre: genreList,
        thumbnailUrl,
        videoKey: finalVideoKey,
        durationSeconds: Number(durationSeconds),
      });

      setUploadStatus('done');
      setSuccessMsg('Video published successfully to Cloudflare R2 and MongoDB Atlas!');

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setThumbnailUrl('');
      setUploadProgress(0);

      // Refresh list
      fetchExistingVideos();
    } catch (err) {
      console.error('Publish error', err);
      setError(err.response?.data?.error || err.message || 'Failed to publish video');
      setUploadStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-red-950/80 border border-red-900/60 px-3 py-1 rounded-full text-xs font-bold text-red-400 mb-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Admin Management Studio</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Content Publishing & R2 Storage</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Direct browser-to-R2 pre-signed uploads + MongoDB Atlas metadata persistence.
            </p>
          </div>

          {/* Architecture Badge */}
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex items-center space-x-4 text-xs text-zinc-300">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>MongoDB Atlas</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center space-x-1.5 text-orange-400 font-semibold">
              <Cloud className="w-4 h-4" />
              <span>Cloudflare R2</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center space-x-1.5 text-blue-400 font-semibold">
              <Server className="w-4 h-4" />
              <span>Express API</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form (2 cols) */}
          <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-red-500" />
              <span>Publish New Title</span>
            </h2>

            {error && (
              <div className="p-4 bg-red-950/60 border border-red-900/60 rounded-xl flex items-center space-x-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-900/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Horizon"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Synopsis / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a compelling overview of the video..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Genre Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    placeholder="Sci-Fi, Action, Thriller"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Thumbnail Poster Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Provide a direct HTTPS poster image link (Unsplash, Cloudflare R2 public URL, or IMGUR)
                </p>
              </div>

              {/* Direct R2 Pre-Signed Upload File Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Video File (Direct Pre-Signed R2 Upload)
                </label>
                <div className="border-2 border-dashed border-zinc-800 hover:border-red-500/60 rounded-2xl p-6 text-center bg-zinc-950/60 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    id="video-file-input"
                    className="hidden"
                  />
                  <label htmlFor="video-file-input" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="w-10 h-10 text-red-500 mx-auto" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                        <p className="text-xs text-zinc-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">
                          Click to select video file for direct R2 upload
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          MP4, WebM, or MOV format (Bypasses Express server memory)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {uploadStatus && (
                <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span>
                      {uploadStatus === 'requesting_url' && '1/3 Generating Cloudflare R2 Presigned PUT Ticket...'}
                      {uploadStatus === 'uploading_r2' && `2/3 Direct Byte Uploading to Cloudflare R2 (${uploadProgress}%)`}
                      {uploadStatus === 'saving_metadata' && '3/3 Registering Metadata Document in MongoDB Atlas...'}
                      {uploadStatus === 'done' && 'Upload & Publishing Complete!'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={Boolean(uploadStatus && uploadStatus !== 'done')}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <Film className="w-5 h-5" />
                <span>Publish Title to Catalog</span>
              </button>
            </form>
          </div>

          {/* Catalog Management Sidebar (1 col) */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Film className="w-5 h-5 text-red-500" />
              <span>Published Catalog ({videos.length})</span>
            </h3>

            {loadingVideos ? (
              <p className="text-xs text-zinc-500">Loading catalog...</p>
            ) : videos.length === 0 ? (
              <p className="text-xs text-zinc-500">No videos published yet.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {videos.map((v) => (
                  <div
                    key={v._id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center space-x-3 hover:border-zinc-700 transition-colors"
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{v.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">Key: {v.videoKey}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
