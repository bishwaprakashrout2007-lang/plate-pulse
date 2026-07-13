import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Search, MapPin, ClipboardList, User, Calendar, Filter, Send, Award, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InteractiveMap from '../components/InteractiveMap';
import TrackingMap from '../components/TrackingMap';

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'ngos', 'requests', 'profile'
  const [ngos, setNgos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Geolocation & Filter States
  const [coords, setCoords] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(20); // default 20km
  const [pickupFilter, setPickupFilter] = useState(''); // '', 'today', 'tomorrow', 'this_week'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [trackingRequestId, setTrackingRequestId] = useState(null);

  // Donation Form States
  const [showForm, setShowForm] = useState(false);
  const [formNgoId, setFormNgoId] = useState('');
  const [donorName, setDonorName] = useState(user?.name || '');
  const [items, setItems] = useState([]); // ['Food', 'Clothes', 'Money', 'Other']
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [moneyType, setMoneyType] = useState('Online'); // 'Online' / 'Offline'
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation tracking blocked. Defaulting to center coordinates.");
        }
      );
    }
  }, []);

  // Fetch NGOs and Requests
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch NGOs with filters
      let ngoUrl = '/ngos?';
      if (coords) {
        ngoUrl += `lat=${coords.latitude}&lng=${coords.longitude}&`;
      }
      ngoUrl += `distance=${distanceFilter}&`;
      if (pickupFilter) {
        ngoUrl += `pickup=${pickupFilter}&`;
      }
      if (searchQuery) {
        ngoUrl += `search=${searchQuery}&`;
      }
      
      const ngoRes = await api.get(ngoUrl);
      setNgos(ngoRes.data);

      // Fetch user requests
      const requestRes = await api.get('/donations/client');
      setRequests(requestRes.data);
    } catch (e) {
      console.error("Error fetching dashboard details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [coords, distanceFilter, pickupFilter, activeTab, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleCheckboxChange = (val) => {
    if (items.includes(val)) {
      setItems(items.filter(item => item !== val));
    } else {
      setItems([...items, val]);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    setLoading(true);

    if (items.length === 0) {
      setFormError('Please select at least one item type to donate.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        donorName,
        items,
        details: items.includes('Money') ? `Money: ${moneyType}. ${details}` : details,
        quantity,
        address,
        date,
        specialInstructions: instructions,
        ngoId: formNgoId || null
      };

      await api.post('/donations/request', payload);
      setSuccessMsg('Donation request submitted successfully! NGO will review it shortly.');
      
      // Reset form
      setItems([]);
      setDetails('');
      setQuantity('');
      setAddress('');
      setDate('');
      setInstructions('');
      setFormNgoId('');
      
      // Refresh list
      const requestRes = await api.get('/donations/client');
      setRequests(requestRes.data);

      setTimeout(() => {
        setShowForm(false);
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDonateForm = (ngoId = '') => {
    setFormNgoId(ngoId);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-client-dashboard">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Dashboard Navigation Tabs */}
        <div className="flex justify-between items-center mb-8 border-b border-white/20 dark:border-zinc-800 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'home', label: 'Home', icon: Heart },
              { id: 'ngos', label: 'NGOs Directory', icon: MapPin },
              { id: 'requests', label: 'Donation Requests', icon: ClipboardList },
              { id: 'profile', label: 'My Profile', icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedNgo(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-brand-dark shadow-md' : 'bg-white/40 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/60 border border-white/25 dark:border-zinc-850'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => triggerDonateForm()}
            className="glass-btn-primary py-2.5 text-sm font-bold"
          >
            Donate Food Now
          </button>
        </div>

        {/* Tab 1: HOME PANEL */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Banner */}
              <div className="glass-panel p-8 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20 text-brand-dark dark:text-zinc-100">
                <h1 className="text-3xl font-extrabold">Welcome back, {user?.name}!</h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm max-w-xl font-medium">
                  Your generosity changes lives. Together we reduce food waste, support local shelters, and bring food safety to our communities in Bhubaneswar.
                </p>
                <button
                  onClick={() => setActiveTab('ngos')}
                  className="glass-btn-primary mt-6 text-xs px-4 py-2.5 font-bold"
                >
                  Locate NGOs Nearby
                </button>
              </div>

              {/* Quick statistics counter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 bg-white/60">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Donations</span>
                  <p className="text-4xl font-extrabold text-amber-500 mt-1">{requests.filter(r => r.status === 'Completed').length}</p>
                  <p className="text-xs text-zinc-400 mt-2">Successful completed deliveries</p>
                </div>
                <div className="glass-card p-6 bg-white/60">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Pending Approvals</span>
                  <p className="text-4xl font-extrabold text-zinc-400 dark:text-zinc-200 mt-1">{requests.filter(r => r.status === 'Pending').length}</p>
                  <p className="text-xs text-zinc-400 mt-2">Awaiting claim confirmation</p>
                </div>
              </div>
            </div>

            {/* Donor appreciation widget */}
            <div className="glass-panel p-6 bg-white/60 flex flex-col items-center text-center">
              <Award className="w-16 h-16 text-amber-500 fill-amber-500/10 mb-4 animate-bounce" />
              <h3 className="font-bold text-lg">PlatePulse Supporter</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Thank you letters are dispatched automatically to your registered email when donations are successfully accepted and verified by NGOs.
              </p>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mt-6">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-2">Level 3: Sustaining Food Donor</span>
            </div>
          </div>
        )}

        {/* Tab 2: NGOs DIRECTORY & FILTER MAPS */}
        {activeTab === 'ngos' && !selectedNgo && (
          <div className="space-y-6">
            <div className="glass-panel p-6 bg-white/60 flex flex-wrap items-center gap-4 justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search NGOs by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input w-full pl-9 pr-4 py-2.5 text-sm"
                />
              </form>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <div className="flex items-center gap-1 bg-white/40 dark:bg-zinc-900 border border-white/20 px-3 py-2.5 rounded-lg">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="font-bold">Distance:</span>
                  <select 
                    value={distanceFilter} 
                    onChange={(e) => setDistanceFilter(Number(e.target.value))}
                    className="bg-transparent font-semibold focus:outline-none ml-1 cursor-pointer"
                  >
                    <option value={1} className="text-brand-dark">1 KM</option>
                    <option value={5} className="text-brand-dark">5 KM</option>
                    <option value={10} className="text-brand-dark">10 KM</option>
                    <option value={20} className="text-brand-dark">20 KM</option>
                    <option value={50} className="text-brand-dark">50 KM</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-white/40 dark:bg-zinc-900 border border-white/20 px-3 py-2.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-bold">Schedule:</span>
                  <select 
                    value={pickupFilter} 
                    onChange={(e) => setPickupFilter(e.target.value)}
                    className="bg-transparent font-semibold focus:outline-none ml-1 cursor-pointer"
                  >
                    <option value="" className="text-brand-dark">All Pickups</option>
                    <option value="today" className="text-brand-dark">Today</option>
                    <option value="tomorrow" className="text-brand-dark">Tomorrow</option>
                    <option value="this_week" className="text-brand-dark">This Week</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leaflet map integration */}
            <InteractiveMap ngos={ngos} userCoords={coords} onSelectNgo={(ngo) => setSelectedNgo(ngo)} />

            {/* NGO grid results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngos.map(ngo => (
                <div 
                  key={ngo.id}
                  onClick={() => setSelectedNgo(ngo)}
                  className="glass-card overflow-hidden hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col h-full bg-white/50"
                >
                  <img 
                    src={ngo.photoUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400"} 
                    alt={ngo.ngoName} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-base line-clamp-1">{ngo.ngoName}</h4>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-xs">
                        ★ {ngo.rating}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ngo.address}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold mt-3 flex items-center gap-1.5">
                      📍 {ngo.distance || '0'} KM from current location
                    </p>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerDonateForm(ngo.id);
                      }}
                      className="glass-btn-primary py-2 text-xs font-bold w-full mt-auto"
                    >
                      Donate Directly
                    </button>
                  </div>
                </div>
              ))}

              {ngos.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  No NGOs found matching the filter distance/pickup limits.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2.5: NGO DETAILS PAGE VIEW */}
        {activeTab === 'ngos' && selectedNgo && (
          <div className="space-y-6">
            <button 
              onClick={() => setSelectedNgo(null)} 
              className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
            >
              ← Back to NGO Directory
            </button>

            <div className="glass-panel overflow-hidden bg-white/60">
              {/* Cover Photo banner */}
              <div className="w-full h-64 bg-zinc-300 relative">
                <img 
                  src={selectedNgo.photoUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800"} 
                  alt={selectedNgo.ngoName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h1 className="text-3xl font-extrabold">{selectedNgo.ngoName}</h1>
                  <p className="text-sm font-semibold flex items-center gap-1 mt-1.5">
                    📍 {selectedNgo.address} | ★ {selectedNgo.rating}
                  </p>
                </div>
              </div>

              {/* Details card content */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2">NGO Mission & Description</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {selectedNgo.description || "Dedicated to auditing urban food wastes, collecting surplus meals from functions, caterers, and residential hubs, and ensuring it reaches shelters and community networks safely."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                    <div>
                      <h4 className="font-bold text-xs uppercase text-zinc-400">Email Address</h4>
                      <p className="text-sm font-semibold text-brand-dark dark:text-zinc-100">{selectedNgo.email}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase text-zinc-400">Contact Number</h4>
                      <p className="text-sm font-semibold text-brand-dark dark:text-zinc-100">{selectedNgo.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Donation Statistics summary */}
                <div className="glass-card p-6 bg-white/60 flex flex-col justify-between">
                  <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Donation Statistics</h3>
                  
                  <div className="space-y-4 my-4">
                    <div>
                      <span className="text-2xl font-extrabold text-brand-dark dark:text-zinc-100">
                        {selectedNgo.donationStats?.completed || '24'}+
                      </span>
                      <p className="text-xs text-zinc-500 font-semibold">Successful food donations claimed</p>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {selectedNgo.donationStats?.peopleFed || '380'}+
                      </span>
                      <p className="text-xs text-zinc-500 font-semibold">Total estimated people fed</p>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDonateForm(selectedNgo.id)}
                    className="glass-btn-primary w-full py-2.5 font-bold text-sm"
                  >
                    Donate to NGO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DONATION REQUESTS TRACKING */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-sans">Track Your Donations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => (
                <div key={req.id} className="glass-card p-6 space-y-4 bg-white/50 border border-white/25">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                        Donation Request #{req.id.slice(0, 8)}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase ${
                      req.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                      req.status === 'Accepted' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse' :
                      req.status === 'Denied' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                      'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 border-t border-white/10 pt-3">
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">Items:</span> {req.items.join(', ')}
                    </p>
                    {req.details && (
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium line-clamp-1">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">Details:</span> {req.details}
                      </p>
                    )}
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">Quantity:</span> {req.quantity}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium line-clamp-1">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">Address:</span> {req.address}
                    </p>
                  </div>

                  {/* Visual Status Step timeline */}
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-amber-500">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </div>
                    <div className={`w-8 h-px border-t-2 ${req.status !== 'Pending' ? 'border-amber-500' : 'border-zinc-300 border-dashed'}`}></div>
                    <div className={`flex items-center gap-1 ${req.status === 'Accepted' || req.status === 'Completed' ? 'text-amber-500' : ''}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Accepted</span>
                    </div>
                    <div className={`w-8 h-px border-t-2 ${req.status === 'Completed' ? 'border-amber-500' : 'border-zinc-300 border-dashed'}`}></div>
                    <div className={`flex items-center gap-1 ${req.status === 'Completed' ? 'text-emerald-500' : ''}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </div>
                  </div>

                  {req.status === 'Accepted' && (
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                          🛵 Rider is on the way
                        </span>
                        <button
                          onClick={() => setTrackingRequestId(trackingRequestId === req.id ? null : req.id)}
                          className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          {trackingRequestId === req.id ? 'Close Map' : 'Track Rider Live'}
                        </button>
                      </div>

                      {trackingRequestId === req.id && (
                        <div className="space-y-3">
                          <div className="h-44 rounded-xl overflow-hidden border border-white/20 relative" style={{ zIndex: 10 }}>
                            <TrackingMap
                              receiverCoords={(() => {
                                const targetNgo = ngos.find(n => n.id === req.ngoId) || { latitude: 20.2961, longitude: 85.8245 };
                                return [targetNgo.latitude || 20.2961, targetNgo.longitude || 85.8245];
                              })()}
                              donorCoords={(() => {
                                const targetNgo = ngos.find(n => n.id === req.ngoId) || { latitude: 20.2961, longitude: 85.8245 };
                                const receiverCoords = [targetNgo.latitude || 20.2961, targetNgo.longitude || 85.8245];
                                let hash = 0;
                                for (let i = 0; i < req.id.length; i++) {
                                  hash = req.id.charCodeAt(i) + ((hash << 5) - hash);
                                }
                                const latOffset = (hash % 100) / 4500;
                                const lngOffset = ((hash >> 8) % 100) / 4500;
                                return [receiverCoords[0] + latOffset, receiverCoords[1] + lngOffset];
                              })()}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                            <div className="p-2 bg-white/40 rounded-lg border border-white/10">
                              <span className="text-zinc-400">Distance</span>
                              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">1.8 KM</p>
                            </div>
                            <div className="p-2 bg-white/40 rounded-lg border border-white/10">
                              <span className="text-zinc-400">ETA</span>
                              <p className="text-sm font-extrabold text-amber-500">6 mins</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {req.donorPhotoUrl && (
                    <div className="pt-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Recipient Upload Confirmation</h5>
                      <img 
                        src={req.donorPhotoUrl} 
                        alt="Donation Receipt Confirm" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}

              {requests.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  No donation requests listed. Click 'Donate Food Now' to submit your first request.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: CLIENT PROFILE PANEL */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto glass-panel p-8 space-y-6 bg-white/60">
            <h2 className="text-2xl font-bold font-sans text-center">My Profile</h2>

            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-amber-500 text-brand-dark flex items-center justify-center font-extrabold text-3xl uppercase">
                {user?.name[0]}
              </div>
              <h3 className="font-extrabold text-xl mt-3">{user?.name}</h3>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-xs font-bold mt-1">
                {user?.role} Account
              </span>
            </div>

            <div className="space-y-4 border-t border-white/20 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-400">Email Address</span>
                <span className="font-semibold">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-400">Verified Mobile</span>
                <span className="font-semibold">{user?.phone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-400">Support Status</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: DONATION REQUEST FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="max-w-md w-full glass-panel p-8 space-y-6 bg-white/90">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold font-sans">Create Donation</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{formError}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Donor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name / Organization"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Target NGO Partner</label>
                <select
                  value={formNgoId}
                  onChange={(e) => setFormNgoId(e.target.value)}
                  className="glass-input w-full text-xs cursor-pointer bg-white text-zinc-850 font-semibold"
                >
                  <option value="" className="text-zinc-500 font-semibold">Any NGO Partner (Public Request)</option>
                  {ngos.map(ngo => (
                    <option key={ngo.id} value={ngo.id} className="text-zinc-800 font-semibold">
                      {ngo.ngoName} ({ngo.address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes: What to Donate */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">What to Donate</label>
                <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
                  {['Food', 'Clothes', 'Money', 'Other'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={items.includes(type)}
                        onChange={() => handleCheckboxChange(type)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* If Money selected: Radio Buttons */}
              {items.includes('Money') && (
                <div className="glass-card p-3 space-y-2">
                  <label className="block text-xs font-bold uppercase text-zinc-400">Payment Channel</label>
                  <div className="flex gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="moneyType"
                        checked={moneyType === 'Online'}
                        onChange={() => setMoneyType('Online')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span>Online Payment</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="moneyType"
                        checked={moneyType === 'Offline'}
                        onChange={() => setMoneyType('Offline')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span>Cash Offline</span>
                    </label>
                  </div>
                </div>
              )}

              {/* If Other selected: Text area description */}
              {items.includes('Other') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Describe Item</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe specific items..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Quantity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 Packs / 15 Kg"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Pickup Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street details and landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Special Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Call before arrival / spicy items"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-btn-primary w-full py-2.5 text-sm font-semibold mt-4"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ClientDashboard;
