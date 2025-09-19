import { NextApiRequest, NextApiResponse } from 'next'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Type definitions
interface UserData {
  name?: string
  age?: string
  gender?: string
  academicStatus?: string
  place?: string
  language?: string
  email?: string
}

interface GameResponse {
  narrative: string
  questionType: 'multi-choice' | 'single-choice' | 'finale'
  options?: Array<{
    id: string
    text: string
  }>
  question?: string
}

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'pathwayz-ai',
  })
}

const db = getFirestore()

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTMjOXxVvh4rNTtuPd4FSFRDGVC1CYCsI'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// System prompt for Career Quest Adventure
const SYSTEM_PROMPT = `Core Directive
You are Gemini, the guide for "Career Quest Adventure." Upon receiving the user's initial details ({name}, {age}, {gender}, {school_stream}, {city_state}, {preferred_language}), your one and only task is to launch the game immediately. Your very first response must be the welcome message and Scenario 1, formatted as a single raw JSON object.

Game Persona and Rules
Language: Always respond in the user's preferred language: {preferred_language}.

Personalization: Use the user's details ({name}, {age}, {gender}, {school_stream}, {city_state}) to make the story relatable and immersive.

Game Flow: The game must advance sequentially through the scenarios: Scenario 1 → Scenario 2 → Scenario 3 → Scenario 4 → Finale. Do not deviate from this order.

Tone: Maintain a fun, encouraging, and adventurous tone throughout the game.

Profile Building (Internal Only): As the user makes choices, you will infer and track their RIASEC types, interests, aptitudes, skills, and values. This information is for internal processing and should NEVER be displayed to the user.

Strict Response Format
Your entire response for each turn MUST be a single, raw JSON object. Do not include any text, notes, or markdown formatting before or after the JSON.

The JSON object must have the following exact keys:

narrative: A string containing the story text and the question for the user.

questionType: A string that is one of "single-choice", "multi-choice", or "finale".

options: An array of strings containing the choices for the user. If questionType is "finale", this must be an empty array [].

Scenario 1: Leisure Village (Interests & Passions)
Turn 1: Initial Question
Narrative: "Welcome, {name}! Your Career Quest Adventure begins now. You stumble into a colorful village buzzing with life, as vibrant as the streets of {city_state}. The sun is setting, and you have free time before nightfall. What catches your eye to unwind and recharge?"

questionType: "single-choice"

options:
"Wander the woods, tinkering with gadgets from scraps."
"Dive into ancient scrolls in the library, decoding secrets."
"Sketch landscapes or perform for villagers."
"Chat with locals, organizing a group game."`

async function getUserData(userUid: string): Promise<UserData | null> {
  try {
    const userDoc = await db.collection('users').doc(userUid).get()
    
    if (!userDoc.exists) {
      console.log('User document not found:', userUid)
      return null
    }
    
    const userData = userDoc.data() as UserData
    return userData
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

async function callGeminiAPI(prompt: string): Promise<GameResponse> {
  const timestamp = new Date().toISOString()
  console.log(`🚀 [${timestamp}] StartGame: Calling Gemini API...`)
  
  try {
    const response = await fetch(GEMINI_API_URL + `?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}. Response: ${errorText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated from Gemini API')
    }

    // Parse the JSON response from Gemini
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim()
    const gameResponse = JSON.parse(cleanedText)

    // Validate the response structure
    if (!gameResponse.narrative || !gameResponse.questionType) {
      throw new Error('Invalid response structure from Gemini API')
    }

    console.log(`✅ [${new Date().toISOString()}] StartGame: Gemini API call successful`)
    return gameResponse
  } catch (error) {
    const errorTimestamp = new Date().toISOString()
    console.error(`🔴 [${errorTimestamp}] StartGame: Gemini API FAILED:`, error)
    console.warn(`⚠️ [${errorTimestamp}] StartGame: Using FALLBACK response - API is unavailable`)
    
    // Fallback response with clear indicator
    return {
      narrative: "⚠️ [DEMO MODE] Welcome to your personalized career discovery journey! I'm your AI guide, and I'm excited to help you explore your potential and discover the careers that align with your unique strengths and interests. Let's begin with understanding what truly engages you.",
      questionType: "multi-choice",
      question: "Which of these activities do you find most engaging and energizing?",
      options: [
        { id: "1", text: "Solving complex puzzles, analyzing data, or working with numbers" },
        { id: "2", text: "Creating art, writing, designing, or expressing ideas creatively" },
        { id: "3", text: "Helping others, teaching, or working in teams" },
        { id: "4", text: "Building, fixing, or understanding how things work mechanically" }
      ]
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userUid, userData } = req.body

    if (!userUid) {
      return res.status(400).json({ error: 'User UID is required' })
    }

    // Use provided user data or try to fetch from Firestore as fallback
    let finalUserData = userData
    if (!finalUserData) {
      finalUserData = await getUserData(userUid)
    }
    
    if (!finalUserData) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Send the raw user data to Gemini as designed in the system prompt
    const initialPrompt = `${SYSTEM_PROMPT}

USER DATA FROM WELCOME FORM:
${JSON.stringify(finalUserData, null, 2)}

Now start the Career Quest Adventure with Scenario 1: Leisure Village. Use the user data above to personalize the experience and respond with a raw JSON object only.`

    // Call Gemini API to get the first question
    const gameResponse = await callGeminiAPI(initialPrompt)

    // Return the response
    res.status(200).json(gameResponse)

  } catch (error) {
    console.error('Error in startGame API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}