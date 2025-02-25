const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Get API key from environment variable
const API_KEY = process.env.API_KEY || 'your-api-key-here';

// Use dynamic import for node-fetch
(async () => {
  const { default: fetch } = await import('node-fetch');

  async function testTranscription(audioFilePath, language = null) {
    try {
      console.log(`Testing transcription for: ${audioFilePath}${language ? ` with language: ${language}` : ''}`);
      
      const formData = new FormData();
      const fileStream = fs.createReadStream(audioFilePath);
      const fileExtension = path.extname(audioFilePath).substring(1);
      
      formData.append('audio', fileStream);
      
      // Add language parameter if specified
      if (language) {
        formData.append('language', language);
        console.log(`Using explicit language: ${language}`);
      } else {
        console.log('Using auto language detection');
      }
      
      console.log('Sending request to transcription service...');
      const response = await fetch('https://file-organizer-2000-audio-transcription.onrender.com/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error(`Transcription failed: ${JSON.stringify(errorData)}`);
        } catch (e) {
          console.error(`Transcription failed with status: ${response.status}`);
        }
        return;
      }
      
      const text = await response.text();
      console.log(`Transcription result: "${text}"`);
      if (!text.trim()) {
        console.log('Warning: Received empty transcription result');
      }
    } catch (error) {
      console.error('Error testing transcription:', error);
    }
  }

  // Test with different Chinese variants if language is 'zh'
  async function testWithChineseVariants(audioFilePath) {
    const variants = ['zh', 'zh-CN', 'zh-TW', 'zh-Hans', 'zh-Hant'];
    
    console.log('Testing with different Chinese language variants:');
    for (const variant of variants) {
      console.log(`\n=== Testing with ${variant} ===`);
      await testTranscription(audioFilePath, variant);
    }
  }

  // Usage: node test-transcription.js path/to/audio/file.webm [language]
  const audioFilePath = process.argv[2];
  const language = process.argv[3]; // Optional language parameter

  if (!audioFilePath) {
    console.error('Please provide an audio file path');
    process.exit(1);
  }

  if (language === 'zh-all') {
    await testWithChineseVariants(audioFilePath);
  } else {
    await testTranscription(audioFilePath, language);
  }
})();
