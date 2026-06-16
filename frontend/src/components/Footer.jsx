import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-t border-white/20 dark:border-zinc-900 py-8 transition-colors duration-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:items-center md:justify-between">
        <div className="flex justify-center items-center gap-2 font-semibold text-lg text-brand-dark dark:text-zinc-100">
          <Heart className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>PlatePulse</span>
        </div>
        <p className="mt-4 md:mt-0 text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} PlatePulse. Connecting surplus food with those who need it most. All rights reserved.
        </p>
        <div className="mt-4 md:mt-0 flex justify-center space-x-6 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-amber-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-amber-500 transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
