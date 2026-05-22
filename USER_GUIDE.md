# 🧠 NeuroLearn: The AI-Native Learning OS
## User Guide & Experience Showcase

NeuroLearn is a cognitively adaptive educational platform that fuses real-time biometrics, multi-agent AI tutoring, and verified skill credentialing into a single, premium ecosystem.

---

## 🚀 The "John" Journey (Example User)

To understand the power of NeuroLearn, let's walk through a typical session for **Aarzu**, an aspiring Data Analyst.

### 1. The Intelligent Start
Aarzu opens the platform and completes the **Cognitive Onboarding**. 
- **Goal**: Data Analyst. 
- **Preference**: Hands-on learning with visual aids.
- **Outcome**: The AI generates a 12-week "Path to Mastery" focused on SQL, Python, and Statistics.

### 2. Deep Work in the Canvas
Aarzu enters the **Learning Canvas** (`/learn`) to study "Advanced SQL Joins."
- **Biometric Check**: As Aarzu leans in, the **Face Tracker** detects "High Engagement." The AI tutor (The Visualizer) remains concise and uses diagrams.
- **The Pivot**: 20 minutes in, Aarzu starts to squint and lean back. The tracker detects "Cognitive Fatigue." 
- **Adaptive Response**: The AI tutor automatically switches to "The Coach" persona, suggesting a 5-minute breather and offering a simpler, encouraging analogy for the current concept.

### 3. Proof of Skill in the Labs
Aarzu navigates to the **Code Lab** (`/labs/code`) to practice.
- **Hands-on**: Aarzu writes a complex multi-join query.
- **AI Review**: Instead of just saying "Correct," the AI code reviewer analyzes the efficiency (Big O notation) and suggests a more optimized index usage.

### 4. Anchoring Achievements
Aarzu completes the **SQL Basics Assessment** (`/assessment`).
- **The Result**: Aarzu scores 92%.
- **The Passport**: A new certificate appears in the **Skill Passport** (`/passport`). This isn't just a JPEG; it's a cryptographically hashed credential anchored to a private ledger, ready to be shared with recruiters.

---

## 🛠 Feature Reference Table

| Feature | Description | URL |
| :--- | :--- | :--- |
| **Cognitive Dashboard** | Real-time analytics of your learning DNA and path progress. | `/dashboard` |
| **Learning Canvas** | 3-panel AI environment with face tracking and adaptive tutoring. | `/learn` |
| **Knowledge DNA** | Interactive D3.js graph of your skill network. | `/graph` |
| **Communication Lab** | AI interview simulator with speech and sentiment analysis. | `/labs/communication` |
| **Career Mentor** | Market-aware job matching based on your skill passport. | `/career` |

## 🛠 Full-Stack Architecture

NeuroLearn has been transitioned to a production-grade full-stack architecture:

- **Database**: Real-time persistence using **Supabase PostgreSQL**.
- **Auth**: Secure session management via **React UserContext** and Supabase.
- **API**: High-performance REST endpoints built with **FastAPI**.
- **Client**: Modern, glassmorphic UI built with **Next.js 15**.

### **Running the Platform**

#### **Backend (Python)**
1. Navigate to `backend/`
2. Activate venv: `.\venv\Scripts\activate`
3. Run: `python -m uvicorn app.main:app --reload`

#### **Frontend (Next.js)**
1. Navigate to root
2. Run: `npm run dev`

---

## 🔧 Technical Specifications

- **Database Schema**: Managed via `backend/schema.sql` (Profiles, Learning Paths, Skills, Credentials, Doubts).
- **Session Persistence**: LocalStorage sync with backend profile fetching.
- **AI Orchestrator**: Context-aware switching between 4 distinct tutor personas.

---

> *"The future of education isn't about more content; it's about content that understands you."*
