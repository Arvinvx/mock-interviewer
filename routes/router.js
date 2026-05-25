import { Router } from 'express'
import { startInterview, answerQuestion } from '../controllers/interviewController.js'

const router = Router()

router.post('/start', startInterview)
router.post('/answer', answerQuestion)

export default router