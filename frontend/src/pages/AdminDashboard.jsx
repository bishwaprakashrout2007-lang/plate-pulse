import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Award, ShieldCheck, Heart, User, Check, Trash2, X, AlertTriangle, Video, Clock } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ngos', 'donations'
  const [stats, setStats] = useState({ totalNgos: 0, totalDonors: 0, totalDonations: 0, pendingVerifications: 0, chartData: [] });
  const [ngos, setNgos] = useState([]);
  const [ngoFilter, setNgoFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [cleaning, setCleaning] = useState(false);
  const [showVisitorPopover, setShowVisitorPopover] = useState(false);
  const [donations, setDonations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Video call verification states
  const [activeKycNgo, setActiveKycNgo] = useState(null);
  const [adminCallJoined, setAdminCallJoined] = useState(false);
  const [simulatedNgoStream, setSimulatedNgoStream] = useState(false);
  const localVideoRef = useRef(null);
  const zegoContainerRef = useRef(null);
  const zegoInstanceRef = useRef(null);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'Admin') {
      navigate('/');
      return;
    }
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      const ngoRes = await api.get('/admin/ngos');
      setNgos(ngoRes.data);

      const donationRes = await api.get('/admin/donations');
      setDonations(donationRes.data);
    } catch (e) {
      console.error("Error loading admin information:", e);
      setError("Failed to load live admin dashboard statistics.");
      setStats({
        totalNgos: 0,
        totalDonors: 0,
        totalDonations: 0,
        pendingVerifications: 0,
        chartData: []
      });
      setNgos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  // Update NGO Status
  const handleUpdateStatus = async (ngoId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/ngos/${ngoId}/status`, { status: newStatus });
      setSuccess(`NGO status updated to ${newStatus} successfully.`);
      fetchAdminData();
      if (activeKycNgo && activeKycNgo.id === ngoId) {
        setActiveKycNgo(null);
      }
    } catch (err) {
      setError('Failed to update NGO status.');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account?")) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('Account successfully deleted from database.');
      fetchAdminData();
    } catch (err) {
      setError('Failed to delete account.');
    }
  };

  const handleCleanFakeNgos = async () => {
    if (!window.confirm("Are you sure you want to clean up all test/fake NGOs from the database? This will delete accounts containing 'test', 'dummy', 'fake', 'sample', or default mock Darpan IDs. This action cannot be undone.")) {
      return;
    }
    setCleaning(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/cleanup-fake-ngos');
      setSuccess(res.data.message || "Fake test NGO data cleaned successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to cleanup fake NGOs.");
    } finally {
      setCleaning(false);
    }
  };

  // Admin join video KYC call
  const startKycCall = (ngo) => {
    setActiveKycNgo(ngo);
    setAdminCallJoined(true);
  };

  const leaveKycCall = () => {
    setAdminCallJoined(false);
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
    if (adminCallJoined && activeKycNgo && zegoContainerRef.current && user) {
      const initZego = async () => {
        try {
          const appID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 298725129;
          const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "874527307b7b70bc7664360d2a705910";
          const roomID = activeKycNgo.id;
          const userID = user.userId;
          const userName = user.name || "Admin Auditor";

          const getZegoPrebuilt = () => {
            return new Promise((resolve, reject) => {
              let checkCount = 0;
              const check = () => {
                if (window.ZegoUIKitPrebuilt) {
                  resolve(window.ZegoUIKitPrebuilt);
                } else if (checkCount > 10) {
                  reject(new Error("Zego SDK load timed out"));
                } else {
                  checkCount++;
                  setTimeout(check, 500);
                }
              };
              check();
            });
          };

          const ZegoUIKitPrebuilt = await getZegoPrebuilt().catch(err => {
            console.error(err);
            setError("ZegoCloud SDK is still loading. Please try again in a moment.");
            return null;
          });
          if (!ZegoUIKitPrebuilt) return;

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
              leaveKycCall();
            }
          });
        } catch (e) {
          console.error("Zego initialization error:", e);
        }
      };
      initZego();
    }
  }, [adminCallJoined, activeKycNgo, user]);

  const filteredNgos = ngos.filter(ngo => {
    if (ngoFilter === 'pending') {
      return ngo.status === 'Pending' || ngo.status === 'PendingVerification' || ngo.status === 'DocumentsApproved';
    }
    if (ngoFilter === 'approved') {
      return ngo.status === 'Verified';
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-admin-dashboard">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Title */}
        <div className="flex justify-between items-center mb-8 border-b border-white/20 dark:border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold font-sans">Admin Central Dashboard</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Verified Admin Account: {user?.email}</p>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Stats Overview' },
              { id: 'ngos', label: 'Manage NGOs' },
              { id: 'donations', label: 'Donation History' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-brand-dark shadow-md' : 'bg-white/40 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-white/25 dark:border-zinc-850'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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

        {/* TAB 1: OVERVIEW & WEEKLY CHARTS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Grid Count Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-6 bg-white/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Registered NGOs</span>
                  <p className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100 mt-1">{stats.totalNgos}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-6 bg-white/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Total Donors</span>
                  <p className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100 mt-1">{stats.totalDonors}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-6 bg-white/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Completed Handovers</span>
                  <p className="text-3xl font-extrabold text-brand-dark dark:text-zinc-100 mt-1">{stats.totalDonations}</p>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                  <Heart className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-6 bg-white/60 flex items-center justify-between border-amber-500/30">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase">KYC Verification Queue</span>
                  <p className="text-3xl font-extrabold text-amber-500 mt-1">{stats.pendingVerifications}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Weekly Analytics Chart container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-6 bg-white/60">
                <h3 className="font-extrabold text-lg mb-6">Weekly Donation Analytics</h3>
                
                {/* SVG/CSS Custom bar graph chart */}
                <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2 border-b border-zinc-200 dark:border-zinc-800">
                  {stats.chartData.map((item, idx) => {
                    const maxVal = Math.max(...stats.chartData.map(d => d.donations), 10);
                    const heightPercent = `${(item.donations / maxVal) * 80}%`;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs font-bold text-amber-600">{item.donations}</span>
                        <div 
                          className="w-full bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 rounded-t-lg transition-all duration-300 shadow-md shadow-amber-500/10"
                          style={{ height: heightPercent }}
                        ></div>
                        <span className="text-xs font-bold text-zinc-400 mt-1">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action shortcuts / Alerts */}
              <div className="glass-panel p-6 bg-white/60 space-y-4">
                <h3 className="font-extrabold text-lg">System Audit Log</h3>
                <div className="space-y-3 text-xs font-medium text-zinc-500">
                  <div className="flex gap-2 p-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>NGO registered. Awaiting video verification scheduling.</span>
                  </div>
                  <div className="flex gap-2 p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Audit complete. NGO status updated to Verified.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE NGOs & VIDEO KYC QUEUE */}
        {activeTab === 'ngos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-sans">Active NGO Partners & Audits</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Manage credentials, review documents, and audit Video KYC queue.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCleanFakeNgos}
                  disabled={cleaning}
                  className="px-4 py-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  {cleaning ? 'Cleaning...' : 'Clean Fake NGOs 🧹'}
                </button>
              </div>
            </div>

            {/* Filter buttons control segment */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setNgoFilter('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  ngoFilter === 'all' 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                    : 'bg-white/30 border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white/40'
                }`}
              >
                Show All ({ngos.length})
              </button>
              <button
                onClick={() => setNgoFilter('pending')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  ngoFilter === 'pending' 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                    : 'bg-white/30 border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white/40'
                }`}
              >
                Awaiting Approval ({ngos.filter(n => n.status !== 'Verified' && n.status !== 'Suspended').length})
              </button>
              <button
                onClick={() => setNgoFilter('approved')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  ngoFilter === 'approved' 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                    : 'bg-white/30 border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white/40'
                }`}
              >
                Approved List ({ngos.filter(n => n.status === 'Verified').length})
              </button>
            </div>

            <div className="glass-panel overflow-hidden border border-white/20 bg-white/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/40 border-b border-white/20 text-xs font-extrabold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">NGO Name</th>
                      <th className="px-6 py-4">Darpan ID</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">KYC Documents</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredNgos.map(ngo => (
                      <tr key={ngo.id} className="hover:bg-white/20 dark:hover:bg-zinc-900/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{ngo.ngoName}</td>
                        <td className="px-6 py-4 font-mono text-xs">{ngo.darpanId}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-500">
                          <p>{ngo.email}</p>
                          <p>{ngo.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          {ngo.kycDocs && ngo.kycDocs.length > 0 ? (
                            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                              {ngo.kycDocs.map((doc, idx) => (
                                <a 
                                  key={idx} 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline truncate max-w-[150px]"
                                  title={doc.name}
                                >
                                  {doc.name || `Certificate ${idx+1}`}
                                </a>
                              ))}
                            </div>
                          ) : ngo.kycDocUrl ? (
                            <a 
                              href={ngo.kycDocUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                            >
                              View Certificate
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400 italic font-semibold">No documents</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            ngo.status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            ngo.status === 'Suspended' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                            ngo.status === 'DocumentsApproved' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                            ngo.status === 'PendingVerification' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                          }`}>
                            {ngo.status === 'DocumentsApproved' ? 'Docs Approved' : ngo.status}
                          </span>
                          {ngo.status === 'DocumentsApproved' && (
                            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Approved by: {ngo.approvedByAdmin || 'Admin'}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Approve Documents step (only for PendingVerification) */}
                          {ngo.status === 'PendingVerification' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(ngo.id, 'DocumentsApproved')}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 rounded-lg inline-flex items-center"
                                title="Approve NGO Documents"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ngo.id, 'Rejected')}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 rounded-lg inline-flex items-center"
                                title="Reject Documents"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Video Call & Verify step (only for DocumentsApproved) */}
                          {ngo.status === 'DocumentsApproved' && (
                            <>
                              <button
                                onClick={() => startKycCall(ngo)}
                                className="p-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-600 rounded-lg inline-flex items-center"
                                title="Start Video KYC"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ngo.id, 'Verified')}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg inline-flex items-center"
                                title="Verify & Approve NGO"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Suspension action (available for Verified NGOs) */}
                          {ngo.status === 'Verified' && (
                            <button
                              onClick={() => handleUpdateStatus(ngo.id, 'Suspended')}
                              className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-600 rounded-lg inline-flex items-center"
                              title="Suspend NGO"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Unsuspend action (available for Suspended/Rejected NGOs) */}
                          {(ngo.status === 'Suspended' || ngo.status === 'Rejected') && (
                            <button
                              onClick={() => handleUpdateStatus(ngo.id, 'Unverified')}
                              className="p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 border border-zinc-500/20 text-zinc-600 rounded-lg inline-flex items-center"
                              title="Reset Status to Unverified"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteAccount(ngo.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 rounded-lg inline-flex items-center"
                            title="Delete NGO Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM DONATIONS LOG */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-sans">Full System Donations Ledger</h2>

            <div className="glass-panel overflow-hidden border border-white/20 bg-white/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/40 border-b border-white/20 text-xs font-extrabold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">Donation ID</th>
                      <th className="px-6 py-4">Donor Name</th>
                      <th className="px-6 py-4">Items / Quantity</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {donations.map(d => (
                      <tr key={d.id} className="hover:bg-white/20 dark:hover:bg-zinc-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">#{d.id.slice(0, 12)}</td>
                        <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{d.donorName}</td>
                        <td className="px-6 py-4 font-semibold text-xs text-zinc-600 dark:text-zinc-400">
                          <p>{d.items.join(', ')}</p>
                          <p className="text-zinc-400">Qty: {d.quantity}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-zinc-500">{d.address}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            d.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            d.status === 'Accepted' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            d.status === 'Denied' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                            'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADMIN ZEGOCLOUD AUDITOR CALL MODAL OVERLAY */}
      {adminCallJoined && activeKycNgo && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-white">
            <span className="font-bold">Admin Video Auditing Chamber: Intersecting {activeKycNgo.ngoName}</span>
            <button onClick={leaveKycCall} className="glass-btn-secondary py-1.5 px-3 text-xs bg-red-600 text-white border-0">
              Leave Call
            </button>
          </div>
          
          <div className="flex-grow p-4 bg-zinc-900 flex items-center justify-center relative">
            <div ref={zegoContainerRef} className="w-full h-full min-h-[450px]" />
          </div>

          {/* Quick verification buttons on call footer */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-white">
            <div className="flex gap-4 items-center">
              <span className="text-xs font-bold text-zinc-400 uppercase">Uploaded KYC Docs:</span>
              <div className="flex gap-2 max-w-lg overflow-x-auto">
                {activeKycNgo.kycDocs && activeKycNgo.kycDocs.length > 0 ? (
                  activeKycNgo.kycDocs.map((doc, idx) => (
                    <a 
                      key={idx} 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-amber-400 hover:underline bg-zinc-800 px-2.5 py-1 rounded whitespace-nowrap"
                    >
                      {doc.name || `Doc ${idx+1}`}
                    </a>
                  ))
                ) : activeKycNgo.kycDocUrl ? (
                  <a 
                    href={activeKycNgo.kycDocUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-bold text-amber-400 hover:underline bg-zinc-800 px-2.5 py-1 rounded whitespace-nowrap"
                  >
                    View Certificate
                  </a>
                ) : (
                  <span className="text-xs text-zinc-500 italic">None</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus(activeKycNgo.id, 'Verified')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                Approve KYC & Verify
              </button>
              <button
                onClick={() => handleUpdateStatus(activeKycNgo.id, 'Rejected')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Reject KYC Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Visitor Count Popover Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative text-left">
          {showVisitorPopover && (
            <div className="absolute bottom-14 right-0 w-64 glass-panel border border-white/20 bg-zinc-950/95 text-white p-4 rounded-2xl shadow-xl space-y-3 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold font-sans tracking-wide text-zinc-400">DEVICE ANALYTICS</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-500 text-brand-dark rounded">Unique Devices</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-zinc-300">🖥️ Desktop Users</span>
                  <span className="font-mono text-amber-400">{stats?.visitors?.desktop || 0}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-zinc-300">📱 Mobile Users</span>
                  <span className="font-mono text-amber-400">{stats?.visitors?.mobile || 0}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-zinc-300">📟 Tablet Users</span>
                  <span className="font-mono text-amber-400">{stats?.visitors?.tablet || 0}</span>
                </div>
              </div>
              
              <div className="text-[9px] text-zinc-500 border-t border-white/10 pt-2 text-center">
                Tracks unique devices opening the site
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowVisitorPopover(!showVisitorPopover)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-brand-dark font-extrabold text-xs rounded-full shadow-lg hover:shadow-xl transition-all border border-amber-600/20 active:scale-95"
          >
            <span>👥</span>
            <span>Visitors: {stats?.visitors?.total || 1}</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
