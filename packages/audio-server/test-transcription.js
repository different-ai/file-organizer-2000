const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Replace with your API key
const API_KEY = process.env.API_KEY || 'your-api-key';

async function testTranscription(audioFilePath) {
  try {
    console.log(`Testing transcription for: ${audioFilePath}`);
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(audioFilePath);
    const fileExtension = path.extname(audioFilePath).substring(1);
    
    formData.append('audio', fileStream);
    
    const response = await fetch('https://file-organizer-2000-audio-transcription.onrender.com/transcribe', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Transcription failed: ${JSON.stringify(errorData)}`);
      return;
    }
    
    const text = await response.text();
    console.log(`Transcription result: ${text}`);
  } catch (error) {
    console.error('Error testing transcription:', error);
  }
}

// Usage: node test-transcription.js path/to/audio/file.webm
const audioFilePath = process.argv[2];
if (!audioFilePath) {
  console.error('Please provide an audio file path');
  process.exit(1);
}

testTranscription(audioFilePath);
