# Pathwayz Project Guide

## 1. Project Overview
Pathwayz is a personalized AI career and skills advisor for students in India. It uses a gamified quiz to understand a user's personality and aptitudes, then leverages AI to provide future-proof career paths and identify "meta-skill" gaps.

## 2. Core Tech Stack
- **Framework:** React with TypeScript and Vite
- **Package Manager:** Bun
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (built on Radix UI)
- **State Management:** Zustand
- **Backend Services:** Firebase (Authentication, Firestore Database)
- **API Logic:** Vercel Serverless Functions (located in the `/api` directory)

## 3. Architectural Principles
- **Client-Server Separation:** The React frontend is the client. It must NEVER call the Gemini API or any other external service directly. All such calls must be proxied through our own Vercel Serverless Functions.
- **API Contract:** All Vercel Serverless Functions must expect a JSON body and return a structured JSON response.
- **Firebase Usage:** Firebase is strictly for data persistence (Firestore) and user identity (Authentication). All complex business logic resides in the Vercel Functions.
- **Security:** All API keys and secret credentials must be managed via Vercel Environment Variables. Never hard-code them.

## 4. Coding Standards
- **Language:** All code must be written in TypeScript with strict mode enabled.
- **Components:** All React components must be functional components using hooks.
- **File Naming:**
    - Components and Pages: `PascalCase.tsx` (e.g., `WelcomeScreen.tsx`)
    - Utility/Library files: `camelCase.ts` (e.g., `firebaseConfig.ts`)
- **Styling:** Use Tailwind CSS utility classes directly. Do not write separate CSS files unless absolutely necessary.
- **State:** Global state (like user authentication) must be managed in the Zustand store. Component-level state should use `useState`.

## 5. Key File Locations
- **Firebase Config:** `src/lib/firebaseConfig.ts`
- **Zustand Store:** `src/store/userStore.ts`
- **Backend APIs:** `/api/*.ts`
- **UI Pages:** `src/pages/*.tsx`
- **Reusable Components:** `src/components/ui/*.tsx` (following Shadcn convention)

## 6. Environment Variables
- **Client-side (Vite):** All variables must be prefixed with `VITE_`. Example: `VITE_FIREBASE_API_KEY`.
- **Server-side (Vercel):** No prefix needed. Example: `GEMINI_API_KEY`.