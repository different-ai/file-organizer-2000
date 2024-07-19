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
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      response_format: "json",
    });

    fs.unlinkSync(req.file.path);
    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error transcribing audio', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));