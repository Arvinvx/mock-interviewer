# Mock Interviewer

Frontend done. Wire up Express backend and open `index.html`.

---

## Backend contract

### POST /start
Starts a session, returns the first question.

**Request:**
```json
{ "jobTitle": "Backend Engineer at Stripe" }
```

**Response:**
```json
{ "question": "Tell me about yourself and why you're interested in this role." }
```

---

### POST /answer
Takes conversation history + user answer, returns feedback + next question (or done signal).

**Request:**
```json
{
  "jobTitle": "Backend Engineer at Stripe",
  "history": [
    { "role": "assistant", "content": "Tell me about yourself..." },
    { "role": "user", "content": "I'm a backend dev with 2 years..." }
  ],
  "isLast": false
}
```

**Response (not last question):**
```json
{
  "score": 7,
  "feedback": "Good structure. Could be more specific about technical stack.",
  "question": "Walk me through a challenging technical problem you solved.",
  "done": false
}
```

**Response (last question):**
```json
{
  "score": 8,
  "feedback": "Strong answer with clear examples.",
  "done": true
}
```

---

## System prompt tip
Tell the model:
- You are a senior interviewer for {jobTitle}
- Ask relevant, role-specific questions
- Score answers 1-10 and give 1-2 sentence feedback
- Return ONLY raw JSON, no backticks

## State
No DB needed. History lives on the frontend — sent with every request. Stateless backend.

## Stack
```
npm install express openai dotenv cors
```
