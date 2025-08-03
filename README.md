# 🔥 SkillForge AI

> The Civilization of learning with generative AI

A Next.js application that gamifies learning through an interactive skill tree with AI-powered quiz generation and explanations.

## ✨ Features

### 🎯 Core Features
- **Interactive Skill Tree**: Civilization-style progression with pan/zoom navigation
- **AI-Powered Learning**: Dynamic quiz generation with contextual explanations
- **User Authentication**: Email/password and Google OAuth integration
- **Real-time Progress**: Live user data synchronization with Firestore
- **Gamification**: Points, levels, achievements, and leaderboards
- **Responsive Design**: Mobile-optimized with dark theme

### 🤖 AI Integration
- **Quiz Generation**: Adaptive questions based on user level and learning style
- **Smart Explanations**: Contextual help for incorrect answers
- **Skill Tree Expansion**: Community-driven content generation
- **Personalized Learning**: AI adapts to individual learning patterns

### 🔐 Authentication & Security
- Firebase Authentication with email/password and Google OAuth
- Protected routes with automatic redirection
- Secure user profile management
- Real-time data synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sevangmb/skillforge.git
   cd skillforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password + Google)
   - Enable Firestore Database
   - Copy your Firebase config to `.env.local`:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```
   
4. **Seed the database (IMPORTANT)**
   This step is crucial to initialize the first skill in your skill tree.
   ```bash
   npm run db:seed
   ```
   
5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library

### Backend & Services
- **Firebase Authentication**: User management
- **Firestore**: Real-time NoSQL database
- **Firebase Hosting**: Web hosting and deployment
- **Google Genkit**: AI integration framework
- **Gemini 2.0 Flash**: LLM for quiz generation

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **Turbopack**: Fast development builds
- **Firebase CLI**: Deployment and management

## 📁 Project Structure

```
skillforge/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Main dashboard
│   │   ├── skill-tree/     # Interactive skill tree
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries
│   │   ├── firebase.ts     # Firebase configuration
│   │   ├── auth.ts         # Authentication services
│   │   └── firestore.ts    # Database operations
│   ├── ai/                 # AI integration
│   │   └── flows/          # Genkit AI flows
│   └── data/               # Mock data and types
├── docs/                   # Documentation
├── firebase.json           # Firebase configuration
├── firestore.rules         # Database security rules
└── package.json
```

## 🎮 Usage

### Getting Started
1. **Sign Up**: Create an account or sign in with Google
2. **Explore**: Navigate the interactive skill tree
3. **Learn**: Click available skills to start quizzes
4. **Progress**: Earn points and unlock new skills
5. **Compete**: Check your ranking on the leaderboard

### Skill Tree Navigation
- **Pan**: Click and drag to move around
- **Zoom**: Mouse wheel to zoom in/out
- **Skills**: Click on available (green) skills to start learning
- **Prerequisites**: Complete required skills to unlock new ones

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI Configuration (Optional)
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Firebase Security Rules
Firestore security rules are configured to:
- Users can only access their own data
- Skills are read-only for authenticated users
- AI content is readable/writable by authenticated users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase**: Authentication and database services
- **Google AI**: Gemini 2.0 Flash for quiz generation
- **Radix UI**: Accessible component primitives
- **Lucide**: Beautiful icon library
- **Tailwind CSS**: Utility-first CSS framework

---

**Live Demo**: [https://skillforge-ai-tk7mp.web.app](https://skillforge-ai-tk7mp.web.app) (after deployment)

**Repository**: [https://github.com/Sevangmb/skillforge](https://github.com/Sevangmb/skillforge)

Made with ❤️ and AI
