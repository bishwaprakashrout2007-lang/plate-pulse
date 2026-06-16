import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Image, Upload, Plus } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Gallery = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  // Gallery form states
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/gallery');
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleAddImage = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const img = imageUrl || "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600";
      await api.post('/public/gallery', { imageUrl: img, description });
      setImageUrl('');
      setDescription('');
      setShowAddForm(false);
      fetchGallery();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add gallery image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-sans">Volunteering Gallery</h1>
            <p className="text-sm text-zinc-500 mt-1">Glimpses of food waste mitigation drives, community support distributions, and volunteer networks</p>
          </div>
          {user && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="glass-btn-primary py-2 px-4 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Share Image</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-semibold mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Add Gallery Form */}
        {showAddForm && (
          <div className="max-w-xl mx-auto glass-panel p-8 mb-8 bg-white/60">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-1.5"><Image className="w-5 h-5 text-amber-500" /> Share Volunteering Moment</h3>
            <form onSubmit={handleAddImage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Image URL</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Unsplash or Cloudinary image link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Volunteers loading food bags at swosti..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)} className="glass-btn-secondary px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="glass-btn-primary px-4 py-2 text-xs font-semibold">Post Image</button>
              </div>
            </form>
          </div>
        )}

        {/* Grid Images Gallery list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="glass-card overflow-hidden group relative h-64 bg-white/50 border border-white/20">
              <img 
                src={item.imageUrl} 
                alt={item.description} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <p className="text-sm font-semibold">{item.description}</p>
                <span className="text-[10px] text-zinc-400 mt-1 font-bold">Uploaded on {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;
