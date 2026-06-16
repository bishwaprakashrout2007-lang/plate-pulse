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
  const [donations, setDonations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Video call verification states
  const [activeKycNgo, setActiveKycNgo] = useState(null);
  const [adminCallJoined, setAdminCallJoined] = useState(false);
  const [simulatedNgoStream, setSimulatedNgoStream] = useState(false);
  const localVideoRef = useRef(null);

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
      // Mock Fallback stats
      setStats({
        totalNgos: 8,
        totalDonors: 142,
        totalDonations: 310,
        pendingVerifications: 2,
        chartData: [
          { day: 'Mon', donations: 4 },
          { day: 'Tue', donations: 8 },
          { day: 'Wed', donations: 5 },
          { day: 'Thu', donations: 12 },
          { day: 'Fri', donations: 9 },
          { day: 'Sat', donations: 15 },
          { day: 'Sun', donations: 7 }
        ]
      });
      setNgos([
        { id: "1", ngoName: "Feed the Hungry NGO", email: "feedhungry@gmail.com", phone: "9861216929", status: "PendingVerification", darpanId: "OD/2026/0111", address: "Khandagiri, Bhubaneswar" },
        { id: "2", ngoName: "Swosti Relief Trust", email: "swostirelief@gmail.com", phone: "8984676600", status: "Verified", darpanId: "OD/2026/0222", address: "Patia, Bhubaneswar" }
      ]);
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

  // Admin join video KYC call
  const startKycCall = (ngo) => {
    setActiveKycNgo(ngo);
    setAdminCallJoined(true);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Simulate NGO representative joining after 2 seconds
        setTimeout(() => {
          setSimulatedNgoStream(true);
        }, 2000);
      })
      .catch((err) => {
        console.warn("Camera/mic access denied on admin browser stream.");
        setTimeout(() => {
          setSimulatedNgoStream(true);
        }, 2000);
      });
  };

  const leaveKycCall = () => {
    setAdminCallJoined(false);
    setSimulatedNgoStream(false);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-semibold mb-6">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 font-semibold mb-6">
            ✓ {success}
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
            <h2 className="text-2xl font-bold font-sans">Active NGO Partners & Audits</h2>

            <div className="glass-panel overflow-hidden border border-white/20 bg-white/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/40 border-b border-white/20 text-xs font-extrabold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">NGO Name</th>
                      <th className="px-6 py-4">Darpan ID</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ngos.map(ngo => (
                      <tr key={ngo.id} className="hover:bg-white/20 dark:hover:bg-zinc-900/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{ngo.ngoName}</td>
                        <td className="px-6 py-4 font-mono text-xs">{ngo.darpanId}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-500">
                          <p>{ngo.email}</p>
                          <p>{ngo.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            ngo.status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            ngo.status === 'Suspended' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-600'
                          }`}>
                            {ngo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {ngo.status !== 'Verified' && (
                            <button
                              onClick={() => handleUpdateStatus(ngo.id, 'Verified')}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg inline-flex items-center"
                              title="Approve NGO"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {ngo.status === 'PendingVerification' && (
                            <button
                              onClick={() => startKycCall(ngo)}
                              className="p-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-600 rounded-lg inline-flex items-center"
                              title="Start Video Auditing"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          )}

                          {ngo.status !== 'Suspended' && (
                            <button
                              onClick={() => handleUpdateStatus(ngo.id, 'Suspended')}
                              className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-600 rounded-lg inline-flex items-center"
                              title="Suspend NGO"
                            >
                              <AlertTriangle className="w-4 h-4" />
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
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Admin camera feed */}
            <div className="bg-zinc-800 rounded-xl relative overflow-hidden border border-zinc-700 flex items-center justify-center">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-xs font-bold">
                You (Admin Auditor)
              </div>
            </div>

            {/* NGO Camera feed */}
            <div className="bg-zinc-800 rounded-xl relative overflow-hidden border border-zinc-700 flex items-center justify-center">
              {simulatedNgoStream ? (
                <>
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600" 
                    alt="NGO Representative" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-xs font-bold">
                    {activeKycNgo.ngoName} Representative
                  </div>
                </>
              ) : (
                <div className="text-center text-zinc-400 space-y-2">
                  <Clock className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs">Waiting for NGO representative to connect...</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick verification buttons on call footer */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-3">
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
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
