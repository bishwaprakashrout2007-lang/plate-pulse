# PlatePulse: Features & Benefits

**PlatePulse** is a modern, premium food waste reduction platform designed to bridge the gap between food donors (restaurants, caterers, individuals) and verified NGO partners. By optimizing surplus food collection and introducing video-based trust verification, the system minimizes food waste while feeding local communities.

---

## Core Features by User Role

### 1. Food Donors (Clients)
- **Surplus Posting**: Fast, simple form to post food listings (food type, quantity, special instructions, pickup time, and photo snaps).
- **Interactive Directory**: Search and locate nearby verified NGOs utilizing an embedded OpenStreetMap interface.
- **Real-Time Request Tracking**: Track active and past donations with live updates.
- **Generosity Statistics**: Visual tracking of donations made, showing cumulative impact.

### 2. NGO Partners
- **Home Feed**: Live dashboard showing real-time surplus food listings nearby.
- **Distance Filtering**: Intelligent distance calculations using the Haversine formula to find the nearest food collections.
- **Interactive Map & Tracking**: View donation locations and track delivery routes.
- **KYC Document & Video Verification**: Upload Darpan/Tax certificates and participate in live 1-to-1 video verification calls with Admin auditors.
- **Proof of Handover**: Upload photos of food handovers directly to the platform with compression and clear/delete (cross-mark) utility.


### 3. Administrators
- **Verification Chamber**: Review pending NGO applications, cross-examine uploaded certificates, and conduct live 1-to-1 video KYC audits.
- **Oversight Dashboard**: Track platform metrics including registered NGOs, total donors, active listings, and completed food deliveries.
- **User Management**: Add, verify, suspend, or remove accounts to keep the ecosystem safe.

---

## Key Benefits of PlatePulse

- 🌱 **Environmental Sustainability**: Prevents fresh food from entering landfills, directly lowering methane emissions and reducing waste footprint.
- 🤝 **Community Support**: Connects surplus food from events, restaurants, and weddings with hungry families through local charity channels.
- 🛡️ **Uncompromised Safety & Trust**: The integrated video KYC audit chamber prevents fraudulent entities from collecting food, establishing absolute accountability.
- ⚡ **Optimized Operations**: Intelligent distance routing ensures that hot/perishable food is picked up and distributed before spoiling.
- 🎨 **Premium User Experience**: Designed using state-of-the-art glassmorphism, responsive themes (Light/Dark mode), and dynamic role-based watermark illustrations to give a premium feel.

---

## Technical Stack & Integrations

- **Frontend**: React.js, TailwindCSS (Vanilla CSS/glassmorphic custom properties), Vite, Lucide Icons.
- **Backend**: FastAPI (Python), Uvicorn.
- **Database**: Firebase Firestore client (with an automatic mock fallback database for zero-config offline development).
- **Authentication**: JWT access tokens and Firebase Google OAuth sign-in.
- **Image Cloud Storage**: Cloudinary (with local static folder fallback upload if credentials are omitted).
- **Video KYC Engine**: ZegoCloud Web UIKit integration for high-quality, real-time 1-on-1 video streams.
