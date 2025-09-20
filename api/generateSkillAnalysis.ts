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

interface SkillAnalysis {
  brief: string
  totalSkills: string[]
  skillGap: string[]
}

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTMjOXxVvh4rNTtuPd4FSFRDGVC1CYCsI'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Skills advisor system prompt
const SKILLS_ADVISOR_PROMPT = `# ROLE & GOAL
You are an expert Skills and Learning Strategist for Pathwayz. Your goal is to create a concise, clear, and actionable skill breakdown for a user's chosen career path, based on their unique profile.

# CONTEXT
The user has a detailed profile and has chosen one of the recommended future-focused career paths. They now need a simple, clear list of the skills required for the path and, most importantly, their personal skill gaps.

# CRITICAL INSTRUCTIONS & CONSTRAINTS
1.  **STRICT JSON OUTPUT:** Your entire response MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON.

2.  **OUTPUT SIMPLICITY:** The JSON object must only contain the three keys specified in the OUTPUT SPECIFICATION section: \`brief\`, \`totalSkills\`, and \`skillGap\`. Do not add any extra information.

3.  **\`totalSkills\` vs. \`skillGap\` DISTINCTION:**
    - The \`totalSkills\` array must contain a **generic** list of 3-5 essential skills for the chosen career path, independent of the user's profile.
    - The \`skillGap\` array must be a **personalized** analysis of the 2 most critical skills the user needs to develop.

4.  **META-SKILLS MANDATE FOR \`skillGap\`:** The \`skillGap\` array MUST exclusively contain **meta-skills**. Meta-skills are foundational, transferable abilities, not specific software or tools.
    - **Examples of meta-skills:** 'Systems Thinking', 'Cognitive Flexibility', 'Interdisciplinary Communication', 'Creative Problem Solving', 'Ethical Reasoning'.

5.  **DEEP PERSONALIZATION FOR \`skillGap\`:** To generate the \`skillGap\`, you must analyze the provided \`userProfile\` (especially their \`keyAptitudes\` and \`problemSolvingStyle\`). For each skill in the gap, you must explain *why* it's a gap for them by connecting it to their existing strengths.

# INPUT
You will receive a JSON object containing two keys:
1.  \`userProfile\`: The user's complete profile object.
2.  \`chosenPath\`: An object containing the \`title\` and \`description\` of the career path they selected.

# OUTPUT SPECIFICATION
Produce a JSON object with the exact following structure.

\`\`\`json
{
  "brief": "A 2-3 sentence, engaging overview of the chosen career path.",
  "totalSkills": [
    "A generic skill essential for this path.",
    "Another generic skill essential for this path.",
    "A third generic skill for this path."
  ],
  "skillGap": [
    "A personalized meta-skill the user needs, explained in a way that builds on their profile.",
    "A second personalized meta-skill the user needs, explained in the same way."
  ]
}
\`\`\``


async function callGeminiAPI(userProfile: UserProfile, chosenPath: CareerPath): Promise<SkillAnalysis> {
  const timestamp = new Date().toISOString()
  console.log(`🚀 [${timestamp}] SkillAnalysis: Calling Gemini API for path: ${chosenPath.title}`)
  
  try {
    const prompt = `${SKILLS_ADVISOR_PROMPT}

INPUT DATA:
{
  "userProfile": ${JSON.stringify(userProfile, null, 2)},
  "chosenPath": ${JSON.stringify(chosenPath, null, 2)}
}

Based on this input, provide the skill analysis in the exact JSON format specified above.`

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
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}. Response: ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini API response received:', data)

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated from Gemini API')
    }

    // Parse the JSON response from Gemini
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim()
    const skillAnalysis = JSON.parse(cleanedText)

    // Validate the response structure
    if (!skillAnalysis.brief || !skillAnalysis.totalSkills || !skillAnalysis.skillGap) {
      throw new Error('Invalid skill analysis structure from Gemini API')
    }

    if (!Array.isArray(skillAnalysis.totalSkills) || !Array.isArray(skillAnalysis.skillGap)) {
      throw new Error('Invalid skill arrays structure from Gemini API')
    }

    console.log(`✅ [${new Date().toISOString()}] SkillAnalysis: Gemini API call successful`)
    return skillAnalysis

  } catch (error) {
    const errorTimestamp = new Date().toISOString()
    console.error(`🔴 [${errorTimestamp}] SkillAnalysis: Gemini API FAILED:`, error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userProfile, careerPath } = req.body

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' })
    }

    if (!careerPath) {
      return res.status(400).json({ error: 'Career path is required' })
    }

    console.log('Generating skill analysis for path:', careerPath.title)

    // Generate skill analysis using Gemini API
    const skillAnalysis = await callGeminiAPI(userProfile, careerPath)

    console.log('Skill analysis generated successfully:', skillAnalysis)

    // Return the generated skill analysis
    res.status(200).json(skillAnalysis)

  } catch (error) {
    console.error('Error in generateSkillAnalysis API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}