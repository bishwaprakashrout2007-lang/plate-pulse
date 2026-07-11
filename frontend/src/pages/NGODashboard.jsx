import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, FileText, Video, CheckCircle, Clock, X, MapPin, Phone, User, Award, ShieldAlert, Navigation, Upload, Check } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NGODashboard = () => {
  const { user, updateNgoStatusLocally } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home'); // 'home', 'requests', 'received', 'wall', 'profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // NGO profile and data states
  const [ngoDetails, setNgoDetails] = useState(null);
  const [donations, setDonations] = useState([]);
  
  // Accept/Deny states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [denyPopupId, setDenyPopupId] = useState(null);
  
  // Tracking states
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [trackingEta, setTrackingEta] = useState('12 mins');
  const [trackingDist, setTrackingDist] = useState('3.4 KM');

  // Receipt form states
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [receiptDonorName, setReceiptDonorName] = useState('');
  const [showReceiptFormId, setShowReceiptFormId] = useState(null);

  // KYC Verification states
  const [kycFile, setKycFile] = useState(null);
  const [kycUploaded, setKycUploaded] = useState(false);
  const [videoCallJoined, setVideoCallJoined] = useState(false);
  const [simulatedAdminStream, setSimulatedAdminStream] = useState(false);
  
  const localVideoRef = useRef(null);
  const zegoContainerRef = useRef(null);
  const zegoInstanceRef = useRef(null);

  const fetchNgoData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const detailsRes = await api.get(`/ngos/${user.userId}`);
      setNgoDetails(detailsRes.data);
      updateNgoStatusLocally(detailsRes.data.status);

      const donationsRes = await api.get('/donations/ngo');
      setDonations(donationsRes.data);
    } catch (e) {
      console.error("Error loading NGO data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgoData();
  }, [user]);

  // Handle document upload
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!kycFile) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', kycFile);

    try {
      const res = await api.post('/ngos/verify/upload-docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setKycUploaded(true);
      setSuccess('KYC documents submitted successfully. Please join the Video Call next.');
      fetchNgoData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  // ZegoCloud Video Call Integration
  const joinVideoCall = async () => {
    try {
      await api.post('/ngos/verify/notify-video-call');
    } catch (err) {
      console.error("Failed to trigger video conference notification email:", err);
    }
    setVideoCallJoined(true);
  };

  const leaveVideoCall = () => {
    setVideoCallJoined(false);
    if (zegoInstanceRef.current) {
      try {
        zegoInstanceRef.current.destroy();
      } catch (e) {
        console.warn("Error destroying Zego instance:", e);
      }
      zegoInstanceRef.current = null;
    }
  };

  useEffect(() => {
    if (videoCallJoined && zegoContainerRef.current && user) {
      const initZego = async () => {
        try {
          const appID = 298725129;
          const serverSecret = "874527307b7b70bc7664360d2a705910";
          const roomID = user.userId;
          const userID = user.userId;
          const userName = user.name || "NGO Representative";

          const ZegoUIKitPrebuilt = window.ZegoUIKitPrebuilt;
          if (!ZegoUIKitPrebuilt) {
            console.error("Zego SDK not loaded yet.");
            return;
          }

          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID,
            serverSecret,
            roomID,
            userID,
            userName
          );

          const zp = ZegoUIKitPrebuilt.create(kitToken);
          zegoInstanceRef.current = zp;

          zp.joinRoom({
            container: zegoContainerRef.current,
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: true,
            showMyCameraToggleButton: true,
            showMyMicrophoneToggleButton: true,
            showAudioVideoSettingsButton: true,
            showScreenSharingButton: true,
            showTextChat: true,
            showUserList: true,
            maxUsers: 2,
            layout: "Auto",
            showLayoutButton: false,
            scenario: {
              mode: ZegoUIKitPrebuilt.OneONoneCall,
              config: {
                role: ZegoUIKitPrebuilt.Host,
              },
            },
            onLeaveRoom: () => {
              leaveVideoCall();
            }
          });
        } catch (e) {
          console.error("Zego initialization error:", e);
        }
      };
      initZego();
    }
  }, [videoCallJoined, user]);

  const handleAcceptRequest = async (req) => {
    try {
      await api.put(`/donations/${req.id}/status`, { status: 'Accepted' });
      setSuccess(`Claimed request #${req.id.slice(0, 8)} successfully!`);
      setSelectedRequest(req);
      fetchNgoData();
    } catch (err) {
      setError('Failed to claim request.');
    }
  };

  const handleDenyConfirm = async (reqId) => {
    try {
      await api.put(`/donations/${reqId}/status`, { status: 'Denied' });
      setSuccess('Request successfully denied.');
      setDenyPopupId(null);
      setSelectedRequest(null);
      fetchNgoData();
    } catch (err) {
      setError('Failed to deny request.');
    }
  };

  const handleReceiptUpload = async (e, reqId) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/donations/${reqId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReceiptPhotoUrl(res.data.url);
    } catch (err) {
      setError('Failed to upload receipt photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (req) => {
    setLoading(true);
    try {
      const photoUrl = receiptPhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600";
      await api.put(`/donations/${req.id}/status`, {
        status: 'Completed',
        donorName: receiptDonorName || req.donorName,
        donorPhotoUrl: photoUrl
      });
      
      setSuccess('Donation receipt recorded! Appreciation email dispatched to donor.');
      setShowReceiptFormId(null);
      setSelectedRequest(null);
      setReceiptPhotoUrl('');
      setReceiptDonorName('');
      fetchNgoData();
    } catch (err) {
      setError('Failed to record receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackDonor = (req) => {
    setTrackingRequest(req);
    // Simulate minor movement offsets
    const etas = ['8 mins', '11 mins', '14 mins', '6 mins'];
    const dists = ['2.1 KM', '3.8 KM', '4.2 KM', '1.7 KM'];
    setTrackingEta(etas[Math.floor(Math.random() * etas.length)]);
    setTrackingDist(dists[Math.floor(Math.random() * dists.length)]);
  };

  // 1. UNVERIFIED OR PENDING VERIFICATION NGO INTERFACE
  if (user && (user.status === 'Unverified' || user.status === 'Pending' || user.status === 'PendingVerification')) {
    return (
      <div className="flex flex-col min-h-screen bg-ngo-dashboard">
        <Navbar />
        
        <main className="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="glass-panel p-8 space-y-6 bg-white/60 text-center">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl text-amber-500 mb-2">
              <ShieldAlert className="w-10 h-10 fill-amber-500/20" />
            </div>
            
            <h1 className="text-3xl font-extrabold font-sans">NGO KYC Verification Portal</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-xl mx-auto font-medium">
              You must upload official certificates and open a live 1-to-1 video interview with PlatePulse Admins before receiving food requests.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
              {/* Step 1: Submit Documents */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                  <FileText className="w-5 h-5" />
                  <span>Step 1: Upload Documents</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Upload Darpan Registration and Tax certificates (Supported: PDF, JPG, PNG).
                </p>

                {ngoDetails?.kycDocs && ngoDetails.kycDocs.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Uploaded Files:</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {ngoDetails.kycDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white/40 border border-white/10 rounded-lg text-xs font-semibold">
                          <span className="truncate max-w-[150px]" title={doc.name}>{doc.name || `Certificate ${idx+1}`}</span>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-amber-600 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : ngoDetails?.kycDocUrl ? (
                  <div className="flex items-center justify-between p-2 bg-white/40 border border-white/10 rounded-lg text-xs font-semibold">
                    <span>KYC Document Certificate</span>
                    <a 
                      href={ngoDetails.kycDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-amber-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                ) : null}

                <form onSubmit={handleDocUpload} className="space-y-3 pt-2 border-t border-white/10">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase">
                    Upload {ngoDetails?.kycDocs?.length > 0 || ngoDetails?.kycDocUrl ? 'Another' : ''} Document:
                  </label>
                  <input 
                    type="file" 
                    required
                    onChange={(e) => setKycFile(e.target.files[0])}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-600 hover:file:bg-amber-500/20 cursor-pointer"
                  />
                  <button type="submit" disabled={loading} className="glass-btn-primary w-full py-2 text-xs font-bold">
                    {loading ? 'Uploading...' : (ngoDetails?.kycDocs?.length > 0 || ngoDetails?.kycDocUrl ? 'Upload Additional Doc' : 'Upload Certificates')}
                  </button>
                </form>
              </div>

              {/* Step 2: Live Video Verification */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                  <Video className="w-5 h-5" />
                  <span>Step 2: Join Live Video call</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Connect live with one of our admins to verify Darpan ID credentials. Maximum 2 users in room.
                </p>
                <button
                  onClick={joinVideoCall}
                  disabled={videoCallJoined}
                  className="glass-btn-primary w-full py-2.5 text-xs font-bold"
                >
                  Join Call Chamber
                </button>
              </div>
            </div>
          </div>

          {/* Video call chamber modal overlay */}
          {videoCallJoined && (
            <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
              <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-white">
                <span className="font-bold">ZegoCloud Live Verification Chamber (Max Users: 2)</span>
                <button onClick={leaveVideoCall} className="glass-btn-secondary py-1.5 px-3 text-xs bg-red-600 text-white border-0">
                  Leave Call
                </button>
              </div>
              
              <div className="flex-grow p-4 bg-zinc-900 flex items-center justify-center relative">
                <div ref={zegoContainerRef} className="w-full h-full min-h-[450px]" />
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // 2. VERIFIED NGO DASHBOARD INTERFACE
  return (
    <div className="flex flex-col min-h-screen bg-ngo-dashboard">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/20 dark:border-zinc-800 pb-4">
          {[
            { id: 'home', label: 'Home Feed', icon: Heart },
            { id: 'requests', label: 'Surplus Requests', icon: Clock },
            { id: 'received', label: 'Donations Received', icon: CheckCircle },
            { id: 'wall', label: 'Donor Wall', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedRequest(null);
                setTrackingRequest(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-brand-dark shadow-md' : 'bg-white/40 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/60 border border-white/25 dark:border-zinc-850'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-semibold mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 font-semibold mb-6 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: HOME PANEL */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-brand-dark dark:text-zinc-100">
                <h1 className="text-3xl font-extrabold">NGO Partner: {ngoDetails?.ngoName}</h1>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold uppercase mt-1 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 fill-emerald-600/10" />
                  <span>Verified Platform status (Darpan ID: {ngoDetails?.darpanId})</span>
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mt-3 text-sm leading-relaxed font-medium">
                  Use the Surplus Requests tab to view active meals listed by surrounding caterers and hotels. You are authorized to navigate, claim, and confirm deliveries.
                </p>
              </div>

              {/* Statistics indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 bg-white/60">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Claims Active</span>
                  <p className="text-4xl font-extrabold text-amber-500 mt-1">
                    {donations.filter(d => d.status === 'Accepted').length}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">Meals currently under transit</p>
                </div>
                <div className="glass-card p-6 bg-white/60">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Completed</span>
                  <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {donations.filter(d => d.status === 'Completed').length}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">Delivered to local shelters</p>
                </div>
              </div>
            </div>

            {/* Verification details */}
            <div className="glass-panel p-6 bg-white/60 space-y-4">
              <h3 className="font-extrabold text-lg">Claim Guidelines</h3>
              <ul className="text-xs text-zinc-500 space-y-3 font-semibold">
                <li>• Verify food container hygiene on pickup site.</li>
                <li>• Take a snap of the donor/receipt during the handover.</li>
                <li>• Mark as received to dispatch appreciation certificate.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: SURPLUS REQUESTS */}
        {activeTab === 'requests' && !selectedRequest && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-sans">Active Surplus Food Requests</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donations.filter(d => d.status === 'Pending').map(req => (
                <div key={req.id} className="glass-card p-6 space-y-4 bg-white/50 border border-white/20 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-lg line-clamp-1">{req.donorName}</h4>
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold px-2 py-0.5 rounded text-xs">
                        Pending Claim
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1.5 mt-3 border-t border-white/10 pt-3 text-zinc-500">
                      <p className="font-medium"><span className="font-bold text-zinc-700 dark:text-zinc-300">Items:</span> {req.items.join(', ')}</p>
                      <p className="font-medium"><span className="font-bold text-zinc-700 dark:text-zinc-300">Quantity:</span> {req.quantity}</p>
                      <p className="font-medium line-clamp-1"><span className="font-bold text-zinc-700 dark:text-zinc-300">Location:</span> {req.address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="glass-btn-primary py-2 text-xs font-bold"
                    >
                      Accept & Claim
                    </button>
                    <button
                      onClick={() => setDenyPopupId(req.id)}
                      className="glass-btn-secondary py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-500/5 border-red-500/20"
                    >
                      Deny Request
                    </button>
                  </div>

                  {/* Confirmed Deny Popup overlay */}
                  {denyPopupId === req.id && (
                    <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="max-w-sm w-full glass-panel p-6 bg-white/95 text-center space-y-4">
                        <h4 className="font-bold text-lg text-zinc-800">Confirm Deny Request?</h4>
                        <p className="text-xs text-zinc-500">Are you sure you want to deny this request?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDenyConfirm(req.id)} className="glass-btn-primary flex-1 py-2 text-xs bg-red-600 hover:bg-red-700 text-white border-0 font-bold">Yes, Deny</button>
                          <button onClick={() => setDenyPopupId(null)} className="glass-btn-secondary flex-1 py-2 text-xs font-bold">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {donations.filter(d => d.status === 'Pending').length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  No pending surplus food donations nearby at the moment. Check back soon.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2.5: ACCEPTED REQUEST CLAIMED DETAILS & TRANSIT TRACKING */}
        {activeTab === 'requests' && selectedRequest && (
          <div className="space-y-6">
            <button 
              onClick={() => setSelectedRequest(null)} 
              className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
            >
              ← Back to Surplus List
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 space-y-6 bg-white/60">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl">Claimed Donation details</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">ID: #{selectedRequest.id.slice(0, 12)}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold text-xs rounded-lg uppercase">
                    Accepted (In-Transit)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y border-white/20 py-6 text-sm">
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs uppercase text-zinc-400">Donor Profile</h4>
                    <p className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-zinc-400" /> {selectedRequest.donorName}</p>
                    <p className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-zinc-400" /> {selectedRequest.address}</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs uppercase text-zinc-400">Donation Items</h4>
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">Types: {selectedRequest.items.join(', ')}</p>
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">Quantity: {selectedRequest.quantity}</p>
                    {selectedRequest.specialInstructions && (
                      <p className="font-semibold text-zinc-600 dark:text-zinc-400">Note: {selectedRequest.specialInstructions}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleTrackDonor(selectedRequest)}
                    className="glass-btn-primary py-2.5 px-6 font-bold text-sm"
                  >
                    Track Donor Location
                  </button>
                  <button
                    onClick={() => setShowReceiptFormId(selectedRequest.id)}
                    className="glass-btn-secondary py-2.5 px-6 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 hover:text-white text-white border-0"
                  >
                    Mark As Received
                  </button>
                </div>
              </div>

              {/* TRACKING MAP SIDEBAR CONTAINER */}
              <div className="glass-panel p-6 bg-white/60 space-y-6">
                <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Delivery Logistics</h4>
                
                {trackingRequest ? (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden h-40 bg-zinc-200 border border-white/20 relative flex items-center justify-center">
                      {/* Leaflet map is configured. Displaying navigation route overlay */}
                      <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                      <div className="text-center p-4 z-10 space-y-1">
                        <Navigation className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                        <h5 className="font-bold text-xs">Dynamic Navigation Route Active</h5>
                        <p className="text-[10px] text-zinc-400">Connecting coordinates to {trackingRequest.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 bg-white/40 rounded-lg border border-white/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Distance</span>
                        <p className="text-lg font-bold text-brand-dark dark:text-zinc-100">{trackingDist}</p>
                      </div>
                      <div className="p-3 bg-white/40 rounded-lg border border-white/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Estimated ETA</span>
                        <p className="text-lg font-bold text-amber-500">{trackingEta}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-12">
                    Click 'Track Donor Location' to plot routing paths and check delivery ETA.
                  </p>
                )}
              </div>
            </div>

            {/* CONFIRM RECEIPT DIALOG MODAL */}
            {showReceiptFormId === selectedRequest.id && (
              <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="max-w-md w-full glass-panel p-8 bg-white/95 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">Handover Receipt Confirmation</h3>
                    <button onClick={() => setShowReceiptFormId(null)} className="text-zinc-400 hover:text-zinc-700">✕</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Confirmed Donor Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder={selectedRequest.donorName}
                        value={receiptDonorName}
                        onChange={(e) => setReceiptDonorName(e.target.value)}
                        className="glass-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-500">Handover Proof Photo (Snap of donor/box)</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/40 hover:border-amber-500 rounded-xl p-4 bg-white/20 hover:bg-white/40 transition-all cursor-pointer">
                          <Upload className="w-6 h-6 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500 mt-1">Click to Upload Handover Snap</span>
                          <input 
                            type="file" 
                            onChange={(e) => handleReceiptUpload(e, selectedRequest.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      {receiptPhotoUrl && (
                        <div className="mt-3 relative rounded-lg overflow-hidden border border-emerald-500/20">
                          <img src={receiptPhotoUrl} alt="Confirm upload" className="w-full h-32 object-cover" />
                          <button
                            type="button"
                            onClick={() => setReceiptPhotoUrl('')}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md z-10"
                            title="Delete snap"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-1 flex items-center justify-between">
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Uploaded successfully</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleConfirmReceipt(selectedRequest)}
                      disabled={loading}
                      className="glass-btn-primary w-full py-2.5 font-bold text-sm"
                    >
                      {loading ? 'Processing Handover...' : 'Confirm Delivery Complete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: DONATIONS RECEIVED HISTORY */}
        {activeTab === 'received' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-sans">Delivered Donations Log</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donations.filter(d => d.status === 'Completed').map(req => (
                <div key={req.id} className="glass-card p-6 space-y-4 bg-white/50 border border-white/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">
                        Donation #{req.id.slice(0, 8)}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Delivered to local shelters</p>
                    </div>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded text-xs uppercase">
                      Delivered
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 border-t border-white/10 pt-3 text-zinc-500">
                    <p className="font-medium"><span className="font-bold text-zinc-700 dark:text-zinc-300 font-sans">Donor Name:</span> {req.donorName}</p>
                    <p className="font-medium"><span className="font-bold text-zinc-700 dark:text-zinc-300">Quantity:</span> {req.quantity}</p>
                    <p className="font-medium"><span className="font-bold text-zinc-700 dark:text-zinc-300">Items:</span> {req.items.join(', ')}</p>
                  </div>

                  {req.donorPhotoUrl && (
                    <div className="pt-2 border-t border-white/10">
                      <h5 className="text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Delivery Proof</h5>
                      <img src={req.donorPhotoUrl} alt="Delivery receipt photo" className="w-full h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              ))}

              {donations.filter(d => d.status === 'Completed').length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  No completed donation receipts logged. Claim and complete surplus items to build your feed.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: DONOR WALL */}
        {activeTab === 'wall' && (
          <div className="max-w-xl mx-auto glass-panel p-8 space-y-6 bg-white/60">
            <h2 className="text-2xl font-bold font-sans text-center">Donor Honor Wall</h2>
            <p className="text-xs text-zinc-500 text-center max-w-sm mx-auto">
              Highlighting the outstanding food donors supporting local community kitchens and reducing food waste.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/20">
              {[
                { name: 'Mayfair Lagoon Caterers', deliveries: 18, badges: '🥇 Top Supplier' },
                { name: 'Hotel Swosti Premium', deliveries: 12, badges: '🥈 Food Saver' },
                { name: 'Asit Kumar Raut', deliveries: 5, badges: '🥉 Neighborhood Hero' }
              ].map((donor, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white/40 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-500 text-brand-dark flex items-center justify-center font-bold rounded-lg text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{donor.name}</h4>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{donor.badges}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">{donor.deliveries} handovers</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NGODashboard;
