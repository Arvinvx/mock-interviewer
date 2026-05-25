import express from 'express'
import cors from 'cors'
import router from "./routes/router.js"
import path from 'path'
import 'dotenv/config'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)



const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'frontend')))
app.use(cors())
app.use(express.json())

app.use('/',router)

app.listen(PORT,() => {
    console.log(`Server is running at http://localhost:${PORT}`);
})

