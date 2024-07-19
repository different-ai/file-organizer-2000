require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${Date.now()}.${fileExtension}`)
  }
});

const upload = multer({ storage: storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  const fileExtension = req.file.filename.split('.').pop().toLowerCase();
  const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

  if (!supportedFormats.includes(fileExtension)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: `Unsupported file format: ${fileExtension}. Supported formats: ${supportedFormats.join(', ')}` });
  }

  try {
    const chunkDuration = 5 * 60; // 5 minutes in seconds
    const audioInfo = await getAudioDuration(req.file.path);
    const totalDuration = audioInfo.duration;
    const chunks = Math.ceil(totalDuration / chunkDuration);
    
    let fullTranscript = '';

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkDuration;
      const end = Math.min((i + 1) * chunkDuration, totalDuration);
      
      const chunkPath = `${req.file.path}_chunk_${i}.${fileExtension}`;
      await splitAudio(req.file.path, chunkPath, start, end);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(chunkPath),
        model: "whisper-1",
        response_format: "json",
      });

      fullTranscript += transcription.text + ' ';
      fs.unlinkSync(chunkPath);
    }

    fs.unlinkSync(req.file.path);
    res.json({ transcript: fullTranscript.trim() });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error transcribing audio', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getAudioDuration(filePath) {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const { stdout } = await execPromise(command);
  return { duration: parseFloat(stdout) };
}

async function splitAudio(inputPath, outputPath, start, end) {
  const command = `ffmpeg -i "${inputPath}" -ss ${start} -to ${end} -c copy "${outputPath}"`;
  await execPromise(command);
}