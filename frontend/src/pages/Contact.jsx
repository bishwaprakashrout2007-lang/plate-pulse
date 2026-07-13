import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Send, Star, Loader2 } from 'lucide-react';
import api from '../services/api';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/public/feedback', {
        userName: name,
        email: email,
        message: message,
        rating: rating
      });
      setSuccess('Thank you! Your feedback has been sent to our administration team.');
      setName('');
      setEmail('');
      setMessage('');
      setRating(5);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16 w-full">
        <div className="glass-panel p-8 bg-white/70 max-w-lg w-full shadow-2xl rounded-2xl border border-white/50 space-y-6 backdrop-blur-md">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Share Your Feedback</h1>
            <p className="text-sm text-zinc-500 font-medium max-w-sm mx-auto">
              We value your input. Send a message directly to our administration team.
            </p>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold flex items-start gap-2 shadow-sm">
              <span className="mt-0.5 text-base">✓</span>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold flex items-start gap-2 shadow-sm">
              <span className="mt-0.5 text-base">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Full Name</label>
              <input 
                type="text" 
                required
                disabled={loading}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full bg-white/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Email Address</label>
              <input 
                type="email" 
                required
                disabled={loading}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full bg-white/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Rating</label>
              <div className="flex gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={loading}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform active:scale-95"
                  >
                    <Star 
                      className={`w-7 h-7 transition-all ${
                        star <= rating 
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]' 
                          : 'text-zinc-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Message</label>
              <textarea 
                rows={4} 
                required
                disabled={loading}
                placeholder="Write your feedback or message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="glass-input w-full text-xs bg-white/50"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="glass-btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
