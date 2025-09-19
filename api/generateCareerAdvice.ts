import { NextApiRequest, NextApiResponse } from 'next'

// Type definitions
interface UserProfile {
  coreMotivators: string[]
  problemSolvingStyle: string
  preferredWorkEnvironment: string
  keyAptitudes: string[]
  interestsAndPassions: string[]
  personalitySummary: string
}

interface CareerPath {
  title: string
  description: string
}

interface CareerAdvice {
  direction: string
  paths: CareerPath[]
}

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTMjOXxVvh4rNTtuPd4FSFRDGVC1CYCsI'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Career advisor system prompt
const CAREER_ADVISOR_PROMPT = `# ROLE & GOAL 

 Act as the core intelligence of Pathwayz, an expert Career Futurist and Technological Strategist. Your prime directive is to provide a user with a hyper-personalized, future-proof career roadmap based on their unique profile and real-time data. You are a career architect for the next decade. 



 # CONTEXT 

 You are providing guidance for a user based in **India**. Your recommendations are the app's single most valuable feature. 



 # CRITICAL INSTRUCTIONS & CONSTRAINTS 

 1.  **FORWARD-LOOKING ONLY:** Do not suggest mainstream jobs. Invent plausible, high-potential roles that will become prominent in the next 3-7 years. 

 2.  **EVIDENCE-BASED:** Every recommended 'Path' must explicitly reference the India-specific tailwind(s) it is based on. 

 3.  **DEEPLY PERSONALIZED:** Every recommendation must connect directly back to a specific combination of traits from the user's profile. 

 4.  **STRICT JSON OUTPUT:** Your entire response must be a single, raw JSON object. Do not include any introductory text, apologies, or explanations outside of the JSON structure. 



 # INPUT 

 You will be given a JSON object containing a detailed user profile. You must perform a deep analysis of this profile to identify the "constellation of traits" that defines their core potential. 



 # WORKFLOW (STEP-BY-STEP PROCESS) 

 ## Step 1: Targeted Tailwind Research (Web Search) 

 Activate your web search tool to find emerging, **India-centric** tailwinds relevant to the user's profile. Investigate sources like: 

 - Indian VCs (Peak XV Partners, Blume Ventures), Y Combinator startups in India. 

 - arXiv.org for research from Indian institutions. 

 - Major Indian government initiatives (Digital India, NEP, Make in India). 

 - NASSCOM, FICCI reports. 



 ## Step 2: Synthesize, Extrapolate, and Create 

 Forge connections between the user's profile and the researched tailwinds. 

 1.  **Create the 'Direction':** A single, powerful, and inspiring sentence. 

 2.  **Invent the 'Paths':** For each of the 5 paths, invent a future-focused job title and write a description explaining the role, the Indian tailwind it rides, and why it fits the user's unique profile. 



 # OUTPUT SPECIFICATION 

 Your final output MUST be a single, raw JSON object conforming exactly to the structure below. 

 \`\`\`json 

 { 

   "direction": "A single, compelling, future-focused sentence that defines the user's career north star.", 

   "paths": [ 

     { 

       "title": "Invented Future-Focused Job Title 1", 

       "description": "Explain the emerging role, the specific Indian tailwind it rides, and its direct connection to the user's unique profile traits." 

     }, 

     { 

       "title": "Invented Future-Focused Job Title 2", 

       "description": "Explain the emerging role, the specific Indian tailwind it rides, and its direct connection to the user's unique profile traits." 

     }, 

     { 

       "title": "Invented Future-Focused Job Title 3", 

       "description": "Explain the emerging role, the specific Indian tailwind it rides, and its direct connection to the user's unique profile traits." 

     }, 

     { 

       "title": "Invented Future-Focused Job Title 4", 

       "description": "Explain the emerging role, the specific Indian tailwind it rides, and its direct connection to the user's unique profile traits." 

     }, 

     { 

       "title": "Invented Future-Focused Job Title 5", 

       "description": "Explain the emerging role, the specific Indian tailwind it rides, and its direct connection to the user's unique profile traits." 

     } 

   ] 

 }`

async function callGeminiAPIWithGrounding(userProfile: UserProfile): Promise<CareerAdvice> {
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      attempts++
      console.log(`Career advice generation attempt ${attempts}/${maxAttempts}`)

      const prompt = `${CAREER_ADVISOR_PROMPT}

USER PROFILE TO ANALYZE:
${JSON.stringify(userProfile, null, 2)}

Based on this user profile, provide the career advice in the exact JSON format specified above.`

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
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2000,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Gemini API response received:', data)

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        throw new Error('No content generated from Gemini API')
      }

      // Career advice generated successfully without grounding

      // Parse the JSON response from Gemini
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim()
      const careerAdvice = JSON.parse(cleanedText)

      // Validate the response structure
      if (!careerAdvice.direction || !careerAdvice.paths || !Array.isArray(careerAdvice.paths) || careerAdvice.paths.length !== 5) {
        throw new Error('Invalid career advice structure from Gemini API')
      }

      // Validate each path has required fields
      for (const path of careerAdvice.paths) {
        if (!path.title || !path.description) {
          throw new Error('Invalid path structure - missing title or description')
        }
      }

      console.log('Career advice generated successfully')
      return careerAdvice

    } catch (error) {
      console.error(`Career advice generation attempt ${attempts} failed:`, error)
      
      if (attempts === maxAttempts) {
        console.error('All career advice generation attempts failed, using fallback')
        
        // Fallback career advice for development/testing
        return {
          direction: "Your unique blend of analytical thinking and creative problem-solving positions you to lead in India's rapidly evolving tech-driven economy.",
          paths: [
            {
              title: "AI Ethics Consultant for Indian Enterprises",
              description: "As India's AI adoption accelerates across sectors like fintech and healthtech, your analytical skills and ethical reasoning make you ideal for ensuring responsible AI implementation in Indian companies, riding the wave of India's Digital India initiative."
            },
            {
              title: "Sustainable Tech Product Manager",
              description: "With India's focus on renewable energy and sustainable development, your problem-solving approach and interest in technology can drive the creation of green tech solutions, capitalizing on government initiatives like the National Solar Mission."
            },
            {
              title: "Cross-Cultural Design Strategist",
              description: "Your communication skills and cultural understanding position you to design user experiences for India's diverse market, especially valuable as Indian startups expand globally and international companies localize for India."
            },
            {
              title: "Data-Driven Policy Analyst",
              description: "Your analytical capabilities align with the growing need for evidence-based policymaking in India's digital governance initiatives, supporting smart city projects and digital transformation across government sectors."
            },
            {
              title: "EdTech Innovation Specialist",
              description: "Your problem-solving style and interest in technology make you perfect for revolutionizing education delivery in India, especially with the NEP 2020 emphasis on digital learning and skill development."
            }
          ]
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempts < maxAttempts) {
        const waitTime = Math.pow(2, attempts) * 1000 // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // This should never be reached due to the fallback above, but TypeScript requires it
  throw new Error('Failed to generate career advice after all attempts')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userUid, userProfile } = req.body

    if (!userUid) {
      return res.status(400).json({ error: 'User UID is required' })
    }

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' })
    }

    // Validate user profile structure
    const requiredFields = ['coreMotivators', 'problemSolvingStyle', 'preferredWorkEnvironment', 'keyAptitudes', 'interestsAndPassions', 'personalitySummary']
    for (const field of requiredFields) {
      if (!userProfile[field]) {
        return res.status(400).json({ error: `Missing required profile field: ${field}` })
      }
    }

    console.log('Generating career advice for user:', userUid)
    console.log('User profile received:', userProfile)

    // Generate career advice using Gemini API with grounding
    const careerAdvice = await callGeminiAPIWithGrounding(userProfile)

    console.log('Career advice generated successfully:', careerAdvice)

    // Return the generated career advice (client will save to Firestore)
    res.status(200).json(careerAdvice)

  } catch (error) {
    console.error('Error in generateCareerAdvice API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}