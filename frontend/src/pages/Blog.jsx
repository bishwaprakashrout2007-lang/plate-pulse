import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, Clock, User, FileText } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Blog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  
  // Blog form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/blogs');
      setBlogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleAddBlog = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const img = imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600";
      await api.post('/public/blogs', { title, content, imageUrl: img });
      setTitle('');
      setContent('');
      setImageUrl('');
      setShowAddForm(false);
      fetchBlogs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit blog post.');
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
            <h1 className="text-3xl font-extrabold font-sans">PlatePulse Educational Blog</h1>
            <p className="text-sm text-zinc-500 mt-1">Insightful articles on food preservation, charity operations, and reducing urban wastage</p>
          </div>
          {user?.role === 'Admin' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="glass-btn-primary py-2 px-4 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Write Post</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Create Blog Form for Admins */}
        {showAddForm && (
          <div className="max-w-xl mx-auto glass-panel p-8 mb-8 bg-white/60">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-1.5"><FileText className="w-5 h-5 text-amber-500" /> Draft New Blog Post</h3>
            <form onSubmit={handleAddBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Food waste management guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Image URL</label>
                <input 
                  type="text" 
                  placeholder="Leave empty for generic unsplash link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Content</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Write post content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)} className="glass-btn-secondary px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="glass-btn-primary px-4 py-2 text-xs font-semibold">Publish Post</button>
              </div>
            </form>
          </div>
        )}

        {/* Blog Post List grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map(blog => (
            <article key={blog.id} className="glass-card overflow-hidden bg-white/50 flex flex-col h-full hover:shadow-lg transition-all duration-300">
              <img 
                src={blog.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"} 
                alt={blog.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-lg line-clamp-2">{blog.title}</h3>
                  <p className="text-zinc-500 text-xs mt-3 leading-relaxed font-semibold line-clamp-3">
                    {blog.content}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-6 border-t border-white/10 pt-4 font-bold uppercase">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> By {blog.author || 'PlatePulse'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
