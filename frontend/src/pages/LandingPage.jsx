import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Users, Sparkles, ArrowRight, BookOpen, Quote } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
  const [stats, setStats] = useState({ NGOs: 12, donors: 184, donations: 423 });
  const [testimonials, setTestimonials] = useState([]);
  const [featuredNgos, setFeaturedNgos] = useState([]);

  useEffect(() => {
    // Fetch statistics and public items
    const fetchPublicData = async () => {
      try {
        const feedbackRes = await api.get('/public/feedback');
        setTestimonials(feedbackRes.data.slice(0, 3));
        
        const ngoRes = await api.get('/ngos');
        setFeaturedNgos(ngoRes.data.slice(0, 3));
      } catch (e) {
        // Fallback default values if API not started yet
        setTestimonials([
          { userName: "Anjali Sharma", message: "PlatePulse has made food donation so easy! I used to throw away extra food, but now it feeds 20 people every day.", rating: 5 },
          { userName: "Ramesh Kumar", message: "Excellent verification process. As a donor, I feel confident knowing the NGOs on this platform are fully audited.", rating: 5 }
        ]);
        setFeaturedNgos([
          { id: "1", ngoName: "Feeding Odisha Foundation", rating: 4.9, address: "Bhubaneswar, Odisha", photoUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400" },
          { id: "2", ngoName: "Robin Hood Army - BBSR", rating: 4.8, address: "Patia, Bhubaneswar", photoUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400" }
        ]);
      }
    };
    fetchPublicData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7 text-center lg:text-left space-y-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empowering Communities, Zero Food Waste</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold font-sans tracking-tight leading-tight">
            Connecting <span className="text-amber-500 bg-amber-500/10 px-3 py-0.5 rounded-xl">Surplus Food</span> <br className="hidden sm:inline" />
            with Those Who Need It Most
          </h1>
          
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium max-w-xl">
            PlatePulse is a modern, verified food donation network bridging restaurants, wedding caterers, and individuals with local, verified NGOs to eliminate urban hunger and reduce carbon footprint.
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
            <Link to="/login" className="glass-btn-primary py-3.5 px-6 text-base font-semibold group hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Donate Food Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login?register=ngo" className="glass-btn-secondary py-3.5 px-6 text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Become partner NGO
            </Link>
          </div>
        </motion.div>

        {/* Right-hand Hero Image Column with float animation and glass card badges */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 relative flex justify-center w-full animate-float mt-8 lg:mt-0"
        >
          <div className="relative max-w-md w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/40 dark:border-zinc-800/40 glass-panel">
            <img
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800"
              alt="Volunteers sharing food"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>
          
          {/* Floating Badge 1 */}
          <div className="absolute -top-6 -left-6 glass-panel p-4 flex items-center gap-3 bg-white/90 dark:bg-zinc-900/90 shadow-lg border border-white/40 max-w-[200px]">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Heart className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meals Served</div>
              <div className="text-lg font-extrabold text-brand-dark dark:text-white">15,000+</div>
            </div>
          </div>

          {/* Floating Badge 2 */}
          <div className="absolute -bottom-6 -right-6 glass-panel p-4 flex items-center gap-3 bg-white/90 dark:bg-zinc-900/90 shadow-lg border border-white/40 max-w-[220px]">
            <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Network Partners</div>
              <div className="text-lg font-extrabold text-brand-dark dark:text-white">100% Verified</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Statistics Counter Row */}
      <section className="max-w-6xl mx-auto px-4 w-full mb-16">
        <div className="glass-panel grid grid-cols-1 md:grid-cols-3 gap-6 p-8 text-center bg-white/50 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center p-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 mb-2">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100">{stats.donors}+</span>
            <span className="text-sm font-semibold text-zinc-500 mt-1">Active Food Donors</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 border-y md:border-y-0 md:border-x border-white/20 dark:border-zinc-800">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100">{stats.NGOs}</span>
            <span className="text-sm font-semibold text-zinc-500 mt-1">Verified NGOs Partners</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600 mb-2">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100">{stats.donations}+</span>
            <span className="text-sm font-semibold text-zinc-500 mt-1">Successful Deliveries</span>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-white/20 dark:bg-zinc-900/10 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-sans">How It Works</h2>
            <p className="text-sm text-zinc-500 mt-2">PlatePulse makes feeding people as simple as 3 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-bold text-lg mb-4">1</div>
              <h3 className="font-bold text-lg">List Surplus Food</h3>
              <p className="text-sm text-zinc-500 mt-2">Enter quantity, pickup location, food type, and upload a snap. Submit request in seconds.</p>
            </div>
            
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-bold text-lg mb-4">2</div>
              <h3 className="font-bold text-lg">Verified NGO Claims</h3>
              <p className="text-sm text-zinc-500 mt-2">Our nearest verified NGO partner accepts the request, views coordinates, and begins navigation.</p>
            </div>

            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center font-bold text-lg mb-4">3</div>
              <h3 className="font-bold text-lg">Track & Complete</h3>
              <p className="text-sm text-zinc-500 mt-2">Verify donor photo on pickup, mark completed, and the donor instantly receives a thank-you letter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured NGOs */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold font-sans">Featured NGOs</h2>
            <p className="text-sm text-zinc-500 mt-1">Verified partner organizations working actively in your area</p>
          </div>
          <Link to="/login" className="text-sm font-semibold text-amber-500 hover:text-amber-600 flex items-center gap-1">
            View All NGOs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredNgos.map(ngo => (
            <div key={ngo.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <img 
                src={ngo.photoUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400"} 
                alt={ngo.ngoName} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg line-clamp-1">{ngo.ngoName}</h3>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold rounded-lg">
                    ★ {ngo.rating}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{ngo.address}</p>
                <Link to="/login" className="glass-btn-secondary w-full py-2.5 text-sm mt-4">
                  Donate to this NGO
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Gallery Showcase */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold font-sans">Visualizing Our Mission</h2>
          <p className="text-sm text-zinc-500 mt-2">Real moments of food rescue, safety compliance, and community care across our network</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
          <div className="group relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <img 
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500" 
              alt="Volunteer packing food" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-xs text-white font-bold uppercase tracking-wider">Food Rescue Crates</span>
              <p className="text-[10px] text-zinc-300 mt-0.5">Volunteers loading and verifying surplus food packages</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg border border-white/20 hover:shadow-xl md:translate-y-6 transition-all duration-300">
            <img 
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500" 
              alt="Distributing meals" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-xs text-white font-bold uppercase tracking-wider">Community Shelter Support</span>
              <p className="text-[10px] text-zinc-300 mt-0.5">Distributing warm meals to shelters daily</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <img 
              src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500" 
              alt="NGO Food storage" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-xs text-white font-bold uppercase tracking-wider">Verified Kitchen Partners</span>
              <p className="text-[10px] text-zinc-300 mt-0.5">Clean audited food storage facilities</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl aspect-[4/3] shadow-lg border border-white/20 hover:shadow-xl md:translate-y-6 transition-all duration-300">
            <img 
              src="https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=500" 
              alt="Cooking hot meals" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-xs text-white font-bold uppercase tracking-wider">Daily Hot Meal Programs</span>
              <p className="text-[10px] text-zinc-300 mt-0.5">NGOs cooking fresh meals for distribution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white/20 dark:bg-zinc-900/10 border-y border-white/10 mt-6 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-sans">Success Stories</h2>
            <p className="text-sm text-zinc-500 mt-2">Hear from our active donors and partners on their experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((test, index) => (
              <div key={index} className="glass-panel p-8 relative overflow-hidden bg-white/60">
                <Quote className="w-12 h-12 text-amber-500/15 absolute right-4 top-4" />
                <p className="text-zinc-700 dark:text-zinc-300 text-base italic leading-relaxed">
                  "{test.message}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-600">
                    {test.userName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{test.userName}</h4>
                    <span className="text-xs text-zinc-500">Verified Platform Donor</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
