const API_START = 'http://localhost:3000/start'
const API_ANSWER = 'http://localhost:3000/answer'

const TOTAL_QUESTIONS = 5

let state = {
  jobTitle: '',
  history: [],
  questionCount: 0,
  answers: [],
  done: false
}

function restart() {
  state = { jobTitle: '', history: [], questionCount: 0, answers: [], done: false }
  document.getElementById('start-screen').style.display = 'block'
  document.getElementById('chat-screen').style.display = 'none'
  document.getElementById('results-screen').style.display = 'none'
  document.getElementById('restart-btn').style.display = 'none'
  document.getElementById('job-input').value = ''
  document.getElementById('start-error').textContent = ''
  document.getElementById('meta-role').textContent = '—'
  document.getElementById('meta-progress').textContent = '0 / ' + TOTAL_QUESTIONS
  document.getElementById('progress-fill').style.width = '0%'
}

function setProgress(n) {
  document.getElementById('meta-progress').textContent = `${n} / ${TOTAL_QUESTIONS}`
  document.getElementById('progress-fill').style.width = `${(n / TOTAL_QUESTIONS) * 100}%`
}

function addMessage(role, text) {
  const log = document.getElementById('chat-log')
  const msg = document.createElement('div')
  msg.className = `msg ${role}`
  msg.innerHTML = `
    <span class="msg-label">${role === 'ai' ? 'interviewer' : 'you'}</span>
    <div class="msg-bubble">${text}</div>
  `
  log.appendChild(msg)
  log.scrollTop = log.scrollHeight
}

function addFeedback(score, feedback) {
  const log = document.getElementById('chat-log')
  const cls = score >= 8 ? 'good' : score >= 5 ? 'ok' : 'weak'
  const label = score >= 8 ? 'Strong' : score >= 5 ? 'Decent' : 'Weak'
  const div = document.createElement('div')
  div.className = 'msg'
  div.innerHTML = `
    <span class="msg-label">feedback</span>
    <span class="score-pill ${cls}">${label} · ${score}/10</span>
    <div class="feedback-bubble ${cls}">${feedback}</div>
  `
  log.appendChild(div)
  log.scrollTop = log.scrollHeight
}

function showTyping() {
  const log = document.getElementById('chat-log')
  const el = document.createElement('div')
  el.id = 'typing'
  el.className = 'msg'
  el.innerHTML = `<span class="msg-label">interviewer</span><div class="typing"><span></span><span></span><span></span></div>`
  log.appendChild(el)
  log.scrollTop = log.scrollHeight
}

function removeTyping() {
  const el = document.getElementById('typing')
  if (el) el.remove()
}

function setAnswerLocked(locked) {
  document.getElementById('answer-input').disabled = locked
  document.getElementById('send-btn').disabled = locked
}

async function startInterview() {
  const input = document.getElementById('job-input').value.trim()
  const errEl = document.getElementById('start-error')
  errEl.textContent = ''

  if (!input) { errEl.textContent = 'Enter a job title first.'; return }

  state.jobTitle = input
  document.getElementById('meta-role').textContent = input
  document.getElementById('restart-btn').style.display = 'flex'

  document.getElementById('start-screen').style.display = 'none'
  document.getElementById('chat-screen').style.display = 'flex'
  document.getElementById('chat-log').innerHTML = ''

  showTyping()

  try {
    const res = await fetch(API_START, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle: input })
    })

    if (!res.ok) throw new Error(`Server error ${res.status}`)
    const data = await res.json()
    removeTyping()

    state.history.push({ role: 'assistant', content: data.question })
    state.questionCount = 1
    setProgress(0)
    addMessage('ai', data.question)

  } catch (err) {
    removeTyping()
    document.getElementById('chat-error').textContent = err.message || 'Could not connect to server.'
  }
}

async function submitAnswer() {
  const input = document.getElementById('answer-input')
  const answer = input.value.trim()
  const errEl = document.getElementById('chat-error')
  errEl.textContent = ''

  if (!answer) { errEl.textContent = 'Write an answer first.'; return }

  addMessage('user', answer)
  input.value = ''
  setAnswerLocked(true)
  showTyping()

  state.history.push({ role: 'user', content: answer })
  state.answers.push({ question: state.history[state.history.length - 2].content, answer })

  const isLast = state.questionCount >= TOTAL_QUESTIONS

  try {
    const res = await fetch(API_ANSWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: state.jobTitle,
        history: state.history,
        isLast
      })
    })

    if (!res.ok) throw new Error(`Server error ${res.status}`)
    const data = await res.json()
    removeTyping()

    addFeedback(data.score, data.feedback)
    state.answers[state.answers.length - 1].score = data.score
    state.answers[state.answers.length - 1].feedback = data.feedback

    setProgress(state.questionCount)

    if (isLast || data.done) {
      document.getElementById('answer-area').style.display = 'none'
      setTimeout(() => showResults(), 1200)
    } else {
      state.history.push({ role: 'assistant', content: data.question })
      state.questionCount++
      addMessage('ai', data.question)
      setAnswerLocked(false)
      input.focus()
    }

  } catch (err) {
    removeTyping()
    errEl.textContent = err.message || 'Something went wrong.'
    setAnswerLocked(false)
  }
}

function showResults() {
  document.getElementById('chat-screen').style.display = 'none'
  document.getElementById('results-screen').style.display = 'block'

  const avg = Math.round(state.answers.reduce((sum, a) => sum + (a.score || 0), 0) / state.answers.length)
  document.getElementById('final-score-badge').textContent = `${avg}/10`

  const list = document.getElementById('results-list')
  list.innerHTML = ''

  state.answers.forEach((a, i) => {
    const cls = a.score >= 8 ? 'good' : a.score >= 5 ? 'ok' : 'weak'
    const card = document.createElement('div')
    card.className = 'result-card'
    card.innerHTML = `
      <p class="result-q">Q${i + 1}. ${a.question}</p>
      <p class="result-a">${a.answer}</p>
      <div class="result-feedback ${cls}">${a.feedback} <strong>(${a.score}/10)</strong></div>
    `
    list.appendChild(card)
  })
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) {
    if (document.getElementById('chat-screen').style.display !== 'none') {
      submitAnswer()
    }
  }
})
