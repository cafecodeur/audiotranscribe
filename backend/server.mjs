
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { setTimeout } from 'timers/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3020;

app.use(cors());

const transcriptionsDir = resolve('transcriptions');
console.log("🧪 Serving static files from:", transcriptionsDir);

app.use('/transcriptions', express.static(transcriptionsDir));
// Configure Multer for 30MB max
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + Date.now() + ext);
    }
  });
  
  const upload = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 }
  });
  

app.post('/upload', upload.single('audio'), async (req, res) => {
    const file = req.file;
    if (!file) {
        console.error("No file uploaded.");
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    console.log(`Received file: ${file.originalname} (${file.size} bytes)`);
    console.log(process.env.OPENAI_API_KEY);
    try {
        const form = new FormData();
        form.append("model", "whisper-1");
        await setTimeout(100);
        form.append("file", fs.createReadStream(file.path));

        console.log("Started processing...");
        let resultText ="Null";
        const MOCK_MODE = 'true';
        if (MOCK_MODE === 'true') {
            console.log("⚠️ MOCK_MODE enabled — skipping OpenAI call.");
            await setTimeout(1000); // simulate latency
            resultText=`{"text":"okay so what so in my experience I have worked on, first of all let me start with the rabbits then I will relive my magician experience also and with all the things that I've worked on in the past so from past some years I'm working from different I'm working for different clients and also "}`;
        } 
        else {
            console.log("⚠️ REAL MODE enabled — calling OpenAI call.");
            const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    ...form.getHeaders()
                },

                body: form
            });
            resultText = await transcriptionResponse.text();
            console.log("OpenAI Raw Response:", resultText);

           
        }
        // const result = await transcriptionResponse.json();

        const result = JSON.parse(resultText);

        if (result.error) {
            console.error("OpenAI API Error:", result.error.message);
            return res.status(500).send({ error: result.error.message });
        }

        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9_\-.]/g, '_');
        const outputPath = path.join(__dirname, 'transcriptions', safeFilename + '.txt');

        fs.writeFileSync(outputPath, result.text);

        console.log(`Transcription complete: ${outputPath}`);
        res.send({ url: `/transcriptions/${safeFilename}.txt` });

    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).send({ error: 'Transcription failed.' });
    }
});
console.log(process.env.OPENAI_API_KEY);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
