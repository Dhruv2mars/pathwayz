import { NextApiRequest, NextApiResponse } from 'next'

// Type definitions
interface ConversationEntry {
  type: 'ai' | 'user'
  content: string | any
  timestamp: string
  selectedOptions?: string[]
}

interface UserProfile {
  coreMotivators: string[]
  problemSolvingStyle: string
  preferredWorkEnvironment: string
  keyAptitudes: string[]
  interestsAndPassions: string[]
  personalitySummary: string
}

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTMjOXxVvh4rNTtuPd4FSFRDGVC1CYCsI'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Psychological analysis system prompt
const PSYCHOLOGICAL_ANALYSIS_PROMPT = `# ROLE & GOAL

You are a psychological analyst AI. Your sole task is to analyze a provided game transcript and create a detailed, structured user profile based on their choices.

# INPUT

You will receive a conversation transcript from the "Career Quest Adventure" game. The user's responses indicate their preferences and personality.

# CRITICAL INSTRUCTIONS & CONSTRAINTS

1. **INFER, DO NOT REPEAT:** Do not simply list the user's answers. Synthesize their choices to infer underlying traits, motivators, and styles.

2. **BE CONCISE:** Keep all descriptions brief and impactful.

3. **STRICT JSON OUTPUT:** Your entire response must be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON.

# OUTPUT SPECIFICATION

Produce a JSON object with the exact following keys:

- \`coreMotivators\`: An array of 2-3 strings describing the user's primary values (e.g., "Creative Expression", "Social Impact", "Intellectual Challenge"). Inferred from the Motivation Maze.

- \`problemSolvingStyle\`: A short string describing how the user approaches problems (e.g., "Analytical & Methodical", "Creative & Inventive", "Collaborative Leader"). Inferred from Puzzle Peak.

- \`preferredWorkEnvironment\`: A string describing the user's ideal work setting (e.g., "Structured & Organized", "Solo & Independent", "Team-Oriented & Communicative"). Inferred from the Team Tavern.

- \`keyAptitudes\`: An array of 3-4 strings listing the user's strongest inferred abilities (e.g., "Logical Reasoning", "Empathetic Communication", "Hands-on Building", "Pattern Recognition"). Inferred from all scenarios.

- \`interestsAndPassions\`: An array of 2-3 strings listing the user's core interests (e.g., "Technology & Gadgets", "Arts & Design", "History & Research"). Inferred from the Leisure Village.

- \`personalitySummary\`: A brief, encouraging one-paragraph summary of the user's overall profile for them to read.

**Example Output Structure:**

\`\`\`json
{
"coreMotivators": ["..."],
"problemSolvingStyle": "...",
"preferredWorkEnvironment": "...",
"keyAptitudes": ["...", "..."],
"interestsAndPassions": ["...", "..."],
"personalitySummary": "..."
}
\`\`\``

async function callGeminiAPI(transcriptText: string): Promise<UserProfile> {
  try {
    const prompt = `${PSYCHOLOGICAL_ANALYSIS_PROMPT}

GAME TRANSCRIPT TO ANALYZE:
${transcriptText}

Analyze the above transcript and provide the psychological profile in the exact JSON format specified.`

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
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated from Gemini API')
    }

    // Parse the JSON response from Gemini
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim()
    const profileData = JSON.parse(cleanedText)

    // Validate the response structure
    if (!profileData.coreMotivators || !profileData.problemSolvingStyle || !profileData.personalitySummary) {
      throw new Error('Invalid profile structure from Gemini API')
    }

    return profileData
  } catch (error) {
    console.error('Error calling Gemini API for profile generation:', error)
    
    // Fallback profile for development
    return {
      coreMotivators: ["Personal Growth", "Creative Expression"],
      problemSolvingStyle: "Adaptive & Thoughtful",
      preferredWorkEnvironment: "Flexible & Collaborative",
      keyAptitudes: ["Critical Thinking", "Communication", "Adaptability"],
      interestsAndPassions: ["Technology", "Problem Solving"],
      personalitySummary: "You demonstrate a balanced approach to challenges, combining analytical thinking with creative solutions. Your responses show someone who values both personal development and meaningful impact, with strong communication skills and adaptability to different situations."
    }
  }
}

function formatTranscriptForAnalysis(conversationHistory: ConversationEntry[]): string {
  return conversationHistory
    .map((entry, index) => {
      if (entry.type === 'ai') {
        const content = typeof entry.content === 'string' ? entry.content : entry.content.narrative
        return `GAME: ${content}`
      } else {
        const content = typeof entry.content === 'string' ? entry.content : 
                       entry.selectedOptions ? entry.selectedOptions.join(', ') : entry.content
        return `USER CHOICE: ${content}`
      }
    })
    .join('\n\n')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userUid, conversationHistory } = req.body

    if (!userUid) {
      return res.status(400).json({ error: 'User UID is required' })
    }

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required and must be an array' })
    }

    // Format the conversation transcript for analysis
    const transcriptText = formatTranscriptForAnalysis(conversationHistory)
    
    console.log('Generating profile for user:', userUid)
    console.log('Transcript length:', transcriptText.length, 'characters')

    // Generate the user profile using Gemini API
    const profileData = await callGeminiAPI(transcriptText)

    console.log('Profile generated successfully:', profileData)

    // Return the generated profile
    res.status(200).json(profileData)

  } catch (error) {
    console.error('Error in generateProfile API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}