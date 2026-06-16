# PlatePulse — Food Waste Reduction Platform

> **"Connecting Surplus Food with Those Who Need It Most"**

A full-stack, production-ready web application built with **React + Tailwind CSS** on the frontend and **Python FastAPI + MongoDB** on the backend. It connects food donors with verified NGOs to eliminate urban food waste.

---

## 🗂️ Project Structure

```
plate-pulse/
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── models/schemas.py  # Pydantic data models
│   │   ├── routes/            # API endpoint handlers
│   │   │   ├── auth.py        # Login, Register, OTP
│   │   │   ├── ngos.py        # NGO management & KYC
│   │   │   ├── donations.py   # Donation request lifecycle
│   │   │   ├── admin.py       # Admin controls & stats
│   │   │   └── public.py      # Blogs, Gallery, Feedback
│   │   ├── services/
│   │   │   ├── email_service.py      # SMTP OTP & appreciation mails
│   │   │   ├── otp_service.py        # 6-digit OTP generator & verifier
│   │   │   ├── cloudinary_service.py # Image upload (Cloudinary or local)
│   │   │   └── zegocloud_service.py  # Video call token generator
│   │   ├── auth.py            # JWT, bcrypt, role checks
│   │   ├── config.py          # Pydantic Settings (.env reader)
│   │   ├── database.py        # Motor MongoDB + in-memory mock fallback
│   │   └── main.py            # FastAPI app entry point
│   ├── .env                   # Local dev config (gitignore this!)
│   ├── .env.example           # Template for production
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # React + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Sticky nav + dark mode + 3-dot menu
│   │   │   ├── Footer.jsx        # Site footer
│   │   │   └── InteractiveMap.jsx # OpenStreetMap / Leaflet map
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Login, register, OTP, role state
│   │   │   └── ThemeContext.jsx  # Dark/Light mode toggle
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Public hero + statistics + testimonials
│   │   │   ├── Login.jsx         # Sign In + Sign Up + OTP flow
│   │   │   ├── ClientDashboard.jsx  # Donor: NGO map, requests, history
│   │   │   ├── NGODashboard.jsx     # NGO: KYC verify + requests + tracking
│   │   │   ├── AdminDashboard.jsx   # Admin: stats + NGO table + video KYC
│   │   │   ├── Blog.jsx          # Blog articles list
│   │   │   ├── Gallery.jsx       # Photo gallery grid
│   │   │   ├── About.jsx         # About Us page
│   │   │   ├── Contact.jsx       # Contact form
│   │   │   └── Feedback.jsx      # Testimonial submit & display
│   │   ├── services/api.js    # Axios client with JWT interceptor
│   │   ├── firebase.js        # Firebase SDK init
│   │   ├── App.jsx            # React Router v6 with protected routes
│   │   ├── main.jsx           # ReactDOM render entry
│   │   └── index.css          # Tailwind + glassmorphism design system
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
├── firebase-rules.json        # Firestore + Storage security rules
└── README.md                  # This file
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| Python | v3.10+ |
| MongoDB | Local or Atlas URI (optional — app has in-memory fallback) |

---

### 1️⃣ Clone / Open the Project

```bash
# Open the existing project folder
cd plate-pulse
```

---

### 2️⃣ Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment config
copy .env.example .env

# Edit .env and fill in real values (optional for dev):
# - MONGO_URI       → Your MongoDB connection string
# - SMTP_USER       → Gmail for sending OTPs
# - SMTP_PASSWORD   → Gmail App Password (not account password)
# - CLOUDINARY_*    → Your Cloudinary credentials
# - ZEGO_APP_ID     → ZegoCloud App ID

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** If MongoDB is not running, the server automatically switches to a built-in **in-memory database** — you can develop and test everything without MongoDB!

API Documentation: http://localhost:8000/docs

---

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install Node dependencies (already done if you followed setup)
npm install

# Start the Vite development server
npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Admin Login Credentials

The following accounts are **hardcoded as Admin** and bypass regular role assignment:

| Email | Password (default) | Phone |
|-------|-------------------|-------|
| `bishwaprakashrout2007@gmail.com` | `admin123` | `8984676600` |
| `asitraut2006@gmail.com` | `admin123` | `9861216929` |

> Change the default password by re-registering or updating directly in MongoDB.

---

## 🧩 Key Features

### 🏠 Landing Page
- Animated hero with statistics counters
- Featured verified NGOs
- How It Works section
- Testimonials & success stories

### 🔐 Authentication
- Email OTP verification before registration
- JWT-based session tokens stored in localStorage
- Role-based routing: **Admin → Admin Dashboard**, **NGO → NGO Dashboard**, **Client → Client Dashboard**
- Developer OTP bypass: use `123456` for instant verification during testing

### 👤 Client (Donor) Dashboard
- Browse nearby NGOs with **OpenStreetMap** distance filters (1–50km)
- Filter by pickup schedule: Today / Tomorrow / This Week
- Geolocation-powered NGO sorting (nearest first)
- Donation request form with checkboxes (Food / Clothes / Money / Other)
- Real-time request status tracking (Pending → Accepted → Completed)

### 🏢 NGO Dashboard
- **KYC Verification Portal** (Step 1: Upload docs, Step 2: Join ZegoCloud video call)
- Accept / Deny incoming donation requests with confirmation popup
- Track donor location with ETA and distance
- Confirm receipt with photo upload → triggers appreciation email
- Donor Honor Wall
- Delivery history log

### 🛡️ Admin Dashboard
- Platform statistics: Total NGOs, Donors, Donations, Pending KYC
- Weekly analytics bar chart
- NGO management table: Approve / Reject / Suspend / Delete
- Full donations ledger
- Live video KYC auditing chamber (ZegoCloud)

---

## 🔥 Firebase Rules

Copy rules from [`firebase-rules.json`](./firebase-rules.json) and apply them:

- **Firestore Rules**: https://console.firebase.google.com/project/plate-pulse-69281/firestore/rules
- **Storage Rules**: https://console.firebase.google.com/project/plate-pulse-69281/storage/rules

---

## 📧 Email Configuration

For production emails (OTP + appreciation letters):

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an **App Password**: Google Account → Security → App Passwords
3. Set in `backend/.env`:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

In development, emails are printed to the **backend console** automatically.

---

## ☁️ Cloudinary Setup

1. Create a free account at https://cloudinary.com
2. Copy Cloud Name, API Key, API Secret from Dashboard
3. Set in `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=123456789
   CLOUDINARY_API_SECRET=your_secret
   ```

Without Cloudinary, images are saved to `backend/static/uploads/` and served locally.

---

## 📹 ZegoCloud Video Setup

1. Create account at https://www.zegocloud.com
2. Create a new project → get **App ID** and **Server Secret**
3. Set in `backend/.env`:
   ```
   ZEGO_APP_ID=your_app_id
   ZEGO_SERVER_SECRET=your_server_secret
   ```

---

## 🚀 Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build          # Builds to frontend/dist/
# Deploy the dist/ folder
```

### Backend (Railway / Render / VPS)
```bash
# Set environment variables in your cloud provider dashboard
# Run:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS v3, Framer Motion, React Router v6 |
| Maps | Leaflet + React-Leaflet (OpenStreetMap) |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Database | MongoDB (Motor async driver) + in-memory fallback |
| Auth | JWT (PyJWT), bcrypt (passlib), Firebase Auth |
| Storage | Cloudinary + Local static fallback |
| Email | SMTP (smtplib) — Gmail App Password |
| Video KYC | ZegoCloud Web UIKit |
| Icons | Lucide React |

---

## 📞 Support

- Admin 1: bishwaprakashrout2007@gmail.com | +91 8984676600
- Admin 2: asitraut2006@gmail.com | +91 9861216929
