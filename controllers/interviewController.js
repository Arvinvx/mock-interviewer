import OpenAI from 'openai';
import 'dotenv/config'


const client = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: process.env.AI_URL
})


export const startInterview = async (req, res) => {
  const { jobTitle } = req.body
  if (!jobTitle){
    return res.status(400).json({ error: 'jobTitle required' })
  }

   const messages = [{
    role : `system`,
content:`You are interviewing a candidate for ${jobTitle}. Ask one interview question. Return ONLY raw JSON: { "question": "..." }` }]


  try{
    const response = await client.chat.completions.create({
        model: process.env.AI_MODEL,
        messages: messages
    })

    const raw = response.choices[0].message.content
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)


    res.json(parsed)

  }catch(err){
    res.status(500).json({error: err.message})
  }
  
  
}

export const answerQuestion = async (req, res) => {
  const { jobTitle, history, isLast } = req.body

  const systemPrompt = isLast
    ? `You are interviewing a candidate for ${jobTitle}. Score their final answer 1-10 and give feedback. This was the last question so do NOT ask another. Return ONLY raw JSON: { "score": number, "feedback": "...", "question": "", "done": true }`
    : `You are interviewing a candidate for ${jobTitle}. Score their answer 1-10, give brief feedback, then ask the next interview question. Return ONLY raw JSON: { "score": number, "feedback": "...", "question": "..." , "done": false }`

  const messages = [{
    role:"system",
    content: systemPrompt
  },
    ...history
]

  try{
    const response = await client.chat.completions.create({
        model: process.env.AI_MODEL,
        messages: messages
    })

  const raw = response.choices[0].message.content
  const clean = raw.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  res.json(parsed)

  }catch(err){
    res.status(500).json({error: err.message})
  }

}