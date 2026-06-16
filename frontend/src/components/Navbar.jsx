import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, MoreVertical, Menu, X, Heart } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threeDotOpen, setThreeDotOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setThreeDotOpen(false);
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'NGO') return '/ngo';
    return '/client';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-white/20 dark:border-zinc-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-sans font-bold text-xl text-brand-dark dark:text-zinc-100">
              <div className="p-2 bg-brand-accent/20 rounded-xl">
                <Heart className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
              </div>
              <span className="tracking-tight">
                Plate<span className="text-amber-500 dark:text-amber-400">Pulse</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">About</Link>
            <Link to="/gallery" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Gallery</Link>
            <Link to="/blog" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Blog</Link>
            <Link to="/feedback" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Feedback</Link>
            <Link to="/contact" className="text-sm font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Contact</Link>
          </div>

          {/* Right Action Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/40 dark:bg-zinc-900/60 border border-white/20 dark:border-zinc-800 text-brand-dark dark:text-zinc-100 hover:bg-brand-accent/20 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Dashboard / Auth Button */}
            {user ? (
              <Link to={getDashboardLink()} className="hidden sm:flex glass-btn-primary py-2 px-4 text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:flex glass-btn-primary py-2 px-4 text-sm font-medium">
                Login
              </Link>
            )}

            {/* Three Dot Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => setThreeDotOpen(!threeDotOpen)}
                className="p-2 rounded-lg bg-white/40 dark:bg-zinc-900/60 border border-white/20 dark:border-zinc-800 text-brand-dark dark:text-zinc-100 hover:bg-brand-accent/20 transition-all duration-200"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {threeDotOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-panel border border-white/30 dark:border-zinc-850 p-2 shadow-xl flex flex-col gap-1 z-50">
                  <Link to="/gallery" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-brand-accent/20 dark:hover:bg-amber-500/10 transition-all duration-150" onClick={() => setThreeDotOpen(false)}>Gallery</Link>
                  <Link to="/about" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-brand-accent/20 dark:hover:bg-amber-500/10 transition-all duration-150" onClick={() => setThreeDotOpen(false)}>About Us</Link>
                  <Link to="/blog" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-brand-accent/20 dark:hover:bg-amber-500/10 transition-all duration-150" onClick={() => setThreeDotOpen(false)}>Blog</Link>
                  <Link to="/feedback" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-brand-accent/20 dark:hover:bg-amber-500/10 transition-all duration-150" onClick={() => setThreeDotOpen(false)}>Feedback</Link>
                  <Link to="/contact" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-brand-accent/20 dark:hover:bg-amber-500/10 transition-all duration-150" onClick={() => setThreeDotOpen(false)}>Contact</Link>
                  {user && (
                    <>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="text-left w-full px-3 py-2 text-sm font-medium text-brand-red dark:text-rose-400 rounded-lg hover:bg-red-500/10 transition-all duration-150"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/40 dark:bg-zinc-900/60 border border-white/20 dark:border-zinc-800 text-brand-dark dark:text-zinc-100 hover:bg-brand-accent/20 transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel rounded-none border-x-0 border-t border-b border-white/10 p-4 flex flex-col gap-3">
          <Link to="/" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/about" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/gallery" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
          <Link to="/blog" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <Link to="/feedback" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>Feedback</Link>
          <Link to="/contact" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-accent/10" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          {user ? (
            <Link to={getDashboardLink()} className="glass-btn-primary py-2 text-center" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="glass-btn-primary py-2 text-center" onClick={() => setMobileMenuOpen(false)}>
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
