import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, Building, Landmark, Image, AlertTriangle, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerParam = searchParams.get('register');

  const { login, loginWithGoogle, register, sendOtp, verifyOtp, registerNgoProfile } = useAuth();
  
  const [isLogin, setIsLogin] = useState(!registerParam);
  const [role, setRole] = useState(registerParam === 'ngo' ? 'NGO' : 'Client'); // 'Client' or 'NGO'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  // NGO Registration Extra Fields
  const [ngoName, setNgoName] = useState('');
  const [darpanId, setDarpanId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (result && result.user) {
          setLoading(true);
          const googleUser = result.user;
          const savedRole = localStorage.getItem('google_login_role') || 'Client';
          localStorage.removeItem('google_login_role');
          
          const loggedUser = await loginWithGoogle(googleUser, savedRole);
          
          if (loggedUser.role === 'Admin') {
            navigate('/admin');
          } else if (loggedUser.role === 'NGO') {
            if (loggedUser.status === 'Verified') {
              navigate('/ngo');
            } else {
              navigate('/ngo/verify');
            }
          } else {
            navigate('/client');
          }
        }
      } catch (err) {
        console.error("Firebase redirect login error:", err);
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, [navigate]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    setError('');
    try {
      const res = await api.post('/public/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPhotoUrl(res.data.url);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      let result;
      try {
        result = await signInWithPopup(firebaseAuth, provider);
      } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
          localStorage.setItem('google_login_role', role);
          await signInWithRedirect(firebaseAuth, provider);
          return;
        } else {
          throw err;
        }
      }
      const googleUser = result.user;
      
      const loggedUser = await loginWithGoogle(googleUser, role);
      
      if (loggedUser.role === 'Admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'NGO') {
        if (loggedUser.status === 'Verified') {
          navigate('/ngo');
        } else {
          navigate('/ngo/verify');
        }
      } else {
        navigate('/client');
      }
    } catch (err) {
      console.error(err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      try {
        const user = await login(email, password);
        if (user.role === 'Admin') navigate('/admin');
        else if (user.role === 'NGO') {
          if (user.status === 'Verified') navigate('/ngo');
          else navigate('/ngo/verify');
        } else navigate('/client');
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    } else {
      // Registration Flow
      if (!emailVerified) {
        setError('Email must be OTP verified before registering.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Create main user profile
        const userReg = await register(name, email, phone, password, role);
        
        // Log user in automatically to get token
        const loggedUser = await login(email, password);
        
        // Step 2: If role is NGO, submit NGO specific details
        if (role === 'NGO') {
          // Provide default placeholder if photoUrl is empty
          const imgUrl = photoUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400";
          await registerNgoProfile({
            ngoName,
            darpanId,
            bankAccount,
            ifsc,
            address,
            photoUrl: imgUrl,
            description
          });
          // Redirect to KYC Document upload / video call page
          navigate('/ngo/verify');
        } else {
          // Client redirects to Client Dashboard
          navigate('/client');
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getBgClass = () => {
    if (isLogin) return '';
    if (role === 'NGO') return 'bg-ngo-dashboard';
    if (role === 'Client') return 'bg-client-dashboard';
    return '';
  };

  return (
    <div className={`flex flex-col min-h-screen ${getBgClass()}`}>
      <Navbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass-panel p-8 space-y-6 bg-white/60">
          <div className="text-center">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl text-amber-500 mb-2">
              <Heart className="w-8 h-8 fill-amber-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold font-sans">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {isLogin ? "Feed families by sharing excess food" : "Join our network of verified donors & NGOs"}
            </p>
          </div>

          {/* Role selector for registration */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/40 dark:bg-zinc-950/40 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => setRole('Client')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${role === 'Client' ? 'bg-amber-500 text-brand-dark shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Food Donor
              </button>
              <button
                type="button"
                onClick={() => setRole('NGO')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${role === 'NGO' ? 'bg-amber-500 text-brand-dark shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                NGO Partner
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration OTP workflow */}
          {!isLogin && !emailVerified && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Email Verification</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={otpSent}
                      className="glass-input w-full pl-9"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      onClick={handleSendOtp}
                      disabled={loading || !email}
                      className="glass-btn-primary px-4 py-2 text-sm whitespace-nowrap"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="glass-card p-4 space-y-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    We've emailed a 6-digit OTP code. Enter it below to verify your email.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="glass-input flex-grow text-center text-lg tracking-widest font-bold"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="glass-btn-primary px-4 py-2 text-sm"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setOtpSent(false)} 
                    className="text-xs font-semibold text-zinc-500 underline"
                  >
                    Change Email Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main Form */}
          {(isLogin || emailVerified) && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="glass-input w-full pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 8984676600"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="glass-input w-full pl-9"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Login Email (Only displayed if Logging In) */}
              {isLogin && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input w-full pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* NGO Registration Fields */}
              {!isLogin && role === 'NGO' && (
                <div className="mt-6 border-t border-white/20 pt-4 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
                    <Building className="w-4 h-4" />
                    <span>NGO Verification Details</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">NGO Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Official NGO Name"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">NGO Darpan ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OR/2026/0123456"
                      value={darpanId}
                      onChange={(e) => setDarpanId(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Bank Account No</label>
                      <input
                        type="text"
                        required
                        placeholder="Account Number"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="glass-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">IFSC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="IFSC Code"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value)}
                        className="glass-input w-full text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">NGO Description</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Briefly describe your NGO's food waste mission..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">NGO Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Physical Office Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">NGO Profile Photo</label>
                    
                    {!photoUrl ? (
                      <div className="relative">
                        <label className="flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 bg-white/20 hover:bg-white/40 transition-all cursor-pointer">
                          <Image className="w-6 h-6 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500 mt-1">
                            {uploadingPhoto ? 'Uploading photo...' : 'Click to Upload Profile Photo'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-250 dark:border-zinc-800">
                        <img src={photoUrl} alt="NGO profile" className="w-full h-36 object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md z-10"
                          title="Delete photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-1 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-bold">✓ Uploaded successfully</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="glass-btn-primary w-full py-3 text-base font-semibold mt-6"
              >
                {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Register & Finalize'}
              </button>
            </form>
          )}

          <div className="flex flex-col gap-3">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-300/30"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-300/30"></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 border border-zinc-200/60 dark:border-zinc-850 rounded-xl bg-white/40 hover:bg-amber-500/10 dark:bg-zinc-900/40 dark:hover:bg-amber-500/10 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13c0-3.047 2.47-5.518 5.518-5.518 1.345 0 2.57.48 3.527 1.274l3.125-3.125C18.665 3.827 16.48 3 14 3 8.486 3 4 7.486 4 13s4.486 10 10 10c5.52 0 10-4.48 10-10 0-.82-.09-1.616-.245-2.385H12.24z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="text-center pt-2 border-t border-white/20">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmailVerified(false);
                setOtpSent(false);
              }}
              className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
