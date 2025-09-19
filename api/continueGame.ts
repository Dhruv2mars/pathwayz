import { NextApiRequest, NextApiResponse } from 'next'

// Type definitions
interface ConversationEntry {
  type: 'ai' | 'user'
  content: string
  timestamp: string
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

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTMjOXxVvh4rNTtuPd4FSFRDGVC1CYCsI'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// System prompt for continuing the Career Quest Adventure
const CONTINUE_PROMPT = `You are Gemini, the guide for "Career Quest Adventure." Continue the adventure based on the conversation history. You must follow the exact scenario progression:

EXACT SCENARIO PROGRESSION:
Turn 1: Scenario 1, Question 1 (already completed)
Turn 2: Scenario 1, Question 2 - Follow-up about school subjects (multi-choice)
Turn 3: Scenario 2, Question 1 - Puzzle Peak initial question (single-choice)
Turn 4: Scenario 2, Question 2 - Follow-up about strengths (multi-choice)
Turn 5: Scenario 3, Question 1 - Team Tavern role selection (single-choice)
Turn 6: Scenario 3, Question 2 - Past experience matching (single-choice)
Turn 7: Scenario 4, Question 1 - Motivation maze paths (single-choice)
Turn 8: Scenario 4, Question 2 - Work environment preference (single-choice)
Turn 9: Finale - Game completion message (finale)

RESPONSE FORMAT:
Respond with raw JSON only, no markdown or extra text:
{
  "narrative": "Story text with question",
  "questionType": "single-choice" | "multi-choice" | "finale",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // empty array for finale
}

EXACT QUESTIONS BY TURN:

Turn 2: Scenario 1 Follow-up
narrative: "The activity sparks your curiosity! Select up to two school subjects that feel just as exciting:"
questionType: "multi-choice"
options: ["Math", "Science", "Art/Design", "History", "Languages/Literature", "Computer Science/Coding", "Business/Economics", "Sports/Physical Education", "Music/Performing Arts", "None of these"]

Turn 3: Scenario 2 Initial  
narrative: "A towering peak blocks your path, guarded by a massive stone puzzle that shifts like a living maze. How do you tackle it to press on?"
questionType: "single-choice"
options: ["Study the patterns closely, calculating the right moves.", "Improvise a wild invention to trick the mechanism.", "Get physical—climb and adjust parts by hand.", "Call out to fellow travelers for ideas and lead the effort."]

Turn 4: Scenario 2 Follow-up
narrative: "As the puzzle clicks open, a strength of yours glows bright. Select up to two that felt spot-on:"
questionType: "multi-choice"
options: ["Spotting hidden patterns", "Quick creative sparks", "Hands-on fixing", "Motivating others", "Logical planning", "Adapting on the fly"]

Turn 5: Scenario 3 Initial
narrative: "In a lively tavern filled with quest-goers, a wise elder recruits you for a side mission. Based on what you've handled before, what role do you grab?"
questionType: "single-choice"
options: ["Plan the map and strategy, keeping everything organized.", "Build tools or scout ahead solo.", "Rally the group, communicating plans.", "Analyze clues and risks from afar."]

Turn 6: Scenario 3 Follow-up
narrative: "The mission succeeds thanks to your input! Select the closest match to a past experience where you shone similarly:"
questionType: "single-choice"
options: ["Led a school club event or team project.", "Built a model or app for a class assignment.", "Presented ideas in a debate or group discussion.", "Researched and wrote a report on a topic.", "Organized a fundraiser or volunteer activity.", "None of these."]

Turn 7: Scenario 4 Initial
narrative: "You enter a foggy maze where glowing paths whisper promises. Which one pulls you deepest, fueling your steps forward?"
questionType: "single-choice"
options: ["The trail of change: Shaping a better world for all.", "The wanderer's way: Total freedom to explore unbound.", "The seeker's shadow: Unearthing forgotten truths.", "The builder's bridge: Creating something enduring."]

Turn 8: Scenario 4 Follow-up
narrative: "One last twist: Would you rather navigate this maze alone, with a close-knit team, or remotely via magic mirrors?"
questionType: "single-choice"
options: ["Solo adventure.", "Team huddle.", "Remote vibes."]

Turn 9: Finale
narrative: "The maze clears, and your adventure comes to a close. Your quest is complete. Thank you for playing!"
questionType: "finale"
options: []`

async function callGeminiAPI(prompt: string, currentTurn: number): Promise<GameResponse> {
  const timestamp = new Date().toISOString()
  console.log(`🚀 [${timestamp}] ContinueGame Turn ${currentTurn}: Calling Gemini API...`)
  
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

    console.log(`✅ [${new Date().toISOString()}] ContinueGame Turn ${currentTurn}: Gemini API call successful`)
    return gameResponse
  } catch (error) {
    const errorTimestamp = new Date().toISOString()
    console.error(`🔴 [${errorTimestamp}] ContinueGame Turn ${currentTurn}: Gemini API FAILED:`, error)
    console.warn(`⚠️ [${errorTimestamp}] ContinueGame Turn ${currentTurn}: Using FALLBACK response - API is unavailable`)
    
    // Deterministic fallback responses based on turn number (no randomness)
    const fallbackResponses = [
      {
        narrative: "⚠️ [DEMO MODE] Interesting! Your choices show a blend of analytical and creative thinking. Now I'd love to understand more about how you prefer to work and collaborate with others.",
        questionType: "single-choice" as const,
        question: "When working on a project, which environment helps you perform your best?",
        options: [
          { id: "1", text: "Quiet, independent workspace where I can focus deeply" },
          { id: "2", text: "Collaborative team environment with lots of discussion" },
          { id: "3", text: "Flexible mix of both individual and team work" },
          { id: "4", text: "Dynamic, fast-paced environment with variety" }
        ]
      },
      {
        narrative: "⚠️ [DEMO MODE] Great insights into your work style! Based on your responses, you seem to have a strong foundation for several exciting career paths. Let me gather a bit more information about your problem-solving approach.",
        questionType: "multi-choice" as const,
        question: "When facing a challenging problem, which approaches do you naturally gravitate toward?",
        options: [
          { id: "1", text: "Break it down into smaller, manageable parts" },
          { id: "2", text: "Research and gather information from multiple sources" },
          { id: "3", text: "Brainstorm creative solutions and think outside the box" },
          { id: "4", text: "Collaborate with others to get different perspectives" }
        ]
      },
      {
        narrative: "⚠️ [DEMO MODE] Great! Let's explore more about your interests and motivations.",
        questionType: "single-choice" as const,
        question: "What type of activities energize you most?",
        options: [
          { id: "1", text: "Leading and organizing team projects" },
          { id: "2", text: "Researching and analyzing complex information" },
          { id: "3", text: "Creating and designing new things" },
          { id: "4", text: "Helping and mentoring others" }
        ]
      },
      {
        narrative: "⚠️ [DEMO MODE] Excellent! You've shown remarkable self-awareness throughout this assessment. Based on your responses, I can see you have a unique combination of analytical thinking, creative problem-solving, and collaborative skills. You're well-positioned for several exciting career paths in India's growing economy, particularly in technology, innovation, and emerging fields that value both technical skills and human insight.",
        questionType: "finale" as const
      }
    ]
    
    // Use turn-based selection instead of random (prevent early game termination)
    let fallbackIndex = 0
    if (currentTurn >= 8) {
      fallbackIndex = 3 // finale only after sufficient questions
    } else if (currentTurn >= 5) {
      fallbackIndex = 2
    } else if (currentTurn >= 3) {
      fallbackIndex = 1
    } else {
      fallbackIndex = 0
    }
    
    console.log(`📋 [${errorTimestamp}] ContinueGame: Using fallback response ${fallbackIndex} for turn ${currentTurn}`)
    return fallbackResponses[fallbackIndex]
  }
}

function formatConversationHistory(history: ConversationEntry[]): string {
  return history
    .map(entry => `${entry.type.toUpperCase()}: ${entry.content}`)
    .join('\n\n')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { conversationHistory, userUid } = req.body

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required and must be an array' })
    }

    if (!userUid) {
      return res.status(400).json({ error: 'User UID is required' })
    }

    // Count the number of AI responses to determine turn number
    const aiResponseCount = conversationHistory.filter(entry => entry.type === 'ai').length
    const currentTurn = aiResponseCount + 1 // Next turn to provide

    // Format conversation history for Gemini
    const formattedHistory = formatConversationHistory(conversationHistory)

    // Create the continuation prompt with specific turn instructions
    const prompt = `${CONTINUE_PROMPT}

CONVERSATION HISTORY:
${formattedHistory}

CURRENT TURN: ${currentTurn}

Based on the conversation history above, provide Turn ${currentTurn} exactly as specified in the EXACT QUESTIONS BY TURN section. Use the exact narrative and options provided for Turn ${currentTurn}. Respond with raw JSON only.`

    // Call Gemini API to get the next question or finale
    const gameResponse = await callGeminiAPI(prompt, currentTurn)

    // Return the response
    res.status(200).json(gameResponse)

  } catch (error) {
    console.error('Error in continueGame API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}