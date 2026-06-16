import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('Thank you! Your message has been sent to our auditing committee. We will respond within 48 hours.');
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Info Left */}
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold font-sans">Get in Touch</h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Have questions about NGO auditing, volunteering drives, or integrating our donation API into your caterer workflow? Reach out to our team in Bhubaneswar.
          </p>

          <div className="space-y-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase">Audit Email</h4>
                <p className="text-sm font-semibold">support@platepulse.org</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase">Helpline</h4>
                <p className="text-sm font-semibold">+91 89846 76600</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-400 uppercase">Headquarters</h4>
                <p className="text-sm font-semibold">Patia Industrial Estate, Bhubaneswar, Odisha</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Right */}
        <div className="glass-panel p-8 bg-white/60 space-y-6">
          <h3 className="font-bold text-lg">Send Message</h3>
          {success && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-semibold">
              ✓ {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">Message</label>
              <textarea 
                rows={3} 
                required
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>
            <button type="submit" className="glass-btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
