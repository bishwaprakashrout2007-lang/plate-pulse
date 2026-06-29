import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Star, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/feedback');
      setFeedbacks(res.data);
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/public/feedback', { userName, email, message, rating });
      setSuccess('Thank you! Your feedback has been recorded.');
      setUserName('');
      setEmail('');
      setMessage('');
      setRating(5);
      fetchFeedback();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Testimonials List Left */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-extrabold font-sans">Community Testimonials</h1>
          <p className="text-sm text-zinc-500 mt-1">Here is what restaurants, wedding event teams, and shelter houses say about PlatePulse</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {feedbacks.map(f => (
              <div key={f.id} className="glass-panel p-6 bg-white/50 space-y-3">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: f.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs italic text-zinc-600 dark:text-zinc-400 font-medium">"{f.message}"</p>
                <div className="flex gap-2 items-center text-xs pt-2 border-t border-white/10 font-bold">
                  <div className="w-7 h-7 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center">
                    {f.userName[0]}
                  </div>
                  <span>{f.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Review Right */}
        <div className="glass-panel p-8 bg-white/60 space-y-6 self-start">
          <h3 className="font-bold text-lg flex items-center gap-1.5"><MessageSquare className="w-5 h-5 text-amber-500" /> Write Testimonial</h3>
          
          {success && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-semibold">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-600 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Your Name</label>
              <input 
                type="text" 
                required
                placeholder="Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Rating (Stars)</label>
              <select 
                value={rating} 
                onChange={(e) => setRating(Number(e.target.value))}
                className="glass-input w-full cursor-pointer"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                <option value={3}>⭐⭐⭐ (3/5)</option>
                <option value={2}>⭐⭐ (2/5)</option>
                <option value={1}>⭐ (1/5)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Message</label>
              <textarea 
                rows={3} 
                required
                placeholder="Write your experience..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <button type="submit" disabled={loading} className="glass-btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              <span>Publish Review</span>
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
