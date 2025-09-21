# Pathwayz 🔥

**AI-Powered Career & Skills Advisor for Students**

A personalized career guidance platform that uses gamified assessments and AI to help students in India discover future-proof career paths and identify skill gaps.

## ✨ Features

- **🎮 Gamified Personality Assessment** - Interactive quiz to understand aptitudes and interests
- **🧠 AI-Powered Career Recommendations** - Personalized career paths using advanced AI
- **📊 Skill Gap Analysis** - Identify specific skills needed for your chosen path
- **🔥 Stunning Fire-Themed UI** - Premium glassmorphism design with warm color palette
- **📱 Mobile-First Design** - Responsive across all devices
- **⚡ Real-time Analytics** - Track progress and learning journey

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** components via Shadcn
- **Zustand** for state management

### Backend & Services  
- **Firebase** (Authentication & Firestore)
- **Vercel Serverless Functions** for API logic
- **AI Integration** for career recommendations

### Development Tools
- **Bun** as package manager and runtime
- **TypeScript** with strict mode
- **PostCSS** for CSS processing

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pathwayz0
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
Create `.env.local` file:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-side (for Vercel functions)
GEMINI_API_KEY=your_gemini_api_key
```

4. **Start development server**
```bash
bun run dev
```

Visit `http://localhost:5173` to see the application.

### For Full-Stack Development
```bash
# Run with Vercel functions
vercel dev
```

## 📁 Project Structure

```
pathwayz0/
├── src/
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   ├── pages/                  # Main application pages
│   ├── lib/                    # Utilities and configurations
│   ├── store/                  # Zustand state management
│   └── index.css              # Global styles
├── api/                        # Vercel serverless functions
├── public/                     # Static assets
└── README.md
```

## 🎨 Design System

The application features a **fire-themed design** with:
- **Warm color palette** (golds, oranges, reds)
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** and micro-interactions
- **Responsive design** for all screen sizes
- **Premium UI components** with hover states

## 🔥 Key Components

### Landing Page
- Dynamic fire particle background
- Animated brand elements
- Responsive hero section
- Feature highlights

### Assessment Flow
- Multi-step gamified quiz
- Progress tracking
- Interactive questions
- Real-time feedback

### Career Advice Page
- AI-generated career paths
- Skill requirement analysis
- Interactive path exploration
- Personalized recommendations

### Skill Gap Modal
- Neural-themed analysis
- Visual skill breakdowns
- Learning recommendations
- Progress tracking

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Build for Production
```bash
bun run build
```

## 🛡️ Architecture Principles

- **Client-Server Separation**: React frontend never calls external APIs directly
- **Security First**: All API keys managed via Vercel environment variables
- **TypeScript Everywhere**: Strict typing for reliability
- **Component-Based**: Reusable UI components following Shadcn patterns
- **Performance Optimized**: Code splitting and lazy loading

## 📊 Performance Features

- **Lazy Loading** for routes and components
- **Image Optimization** with proper formats
- **Bundle Splitting** for optimal loading
- **Caching Strategies** for API responses
- **Mobile Optimization** for fast loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🔧 Development Scripts

```bash
# Development
bun run dev          # Start Vite dev server
vercel dev           # Start with serverless functions

# Building
bun run build        # Build for production
bun run preview      # Preview production build

# Utilities
bun install          # Install dependencies
```

## 🐛 Known Issues

- Ensure Firebase configuration is properly set up
- Vercel functions require proper environment variables
- Some animations may require WebGL support

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Built with ❤️ for empowering students' career journeys**