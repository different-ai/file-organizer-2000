# Audio Transcription Server

This server handles audio transcription using Deepgram's API.

## Local Setup

To set up the audio transcription server for local testing:

1. Create a `.env` file in the `packages/audio-server` directory:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   API_KEY=your_unkey_api_key_here
   ```

2. Install dependencies:
   ```
   cd packages/audio-server
   pnpm install
   ```

3. Start the server:
   ```
   pnpm start
   ```

## Testing Transcription

You can use the included test script to verify transcription works correctly:

```bash
# Set your API key as an environment variable
export API_KEY=your_api_key_here

# Run the test script with an audio file
node test-transcription.js path/to/audio/file.webm
```

## Troubleshooting

### 401 Unauthorized Error

If you see a `401 Unauthorized` error when trying to transcribe audio, it means your API key is missing or invalid. Check:

1. In the plugin settings, make sure your API key is correctly set
2. For local testing, ensure your API key is set in the environment or in the test script
3. Verify that your API key has not expired

### Debugging Transcription Issues

The enhanced logging added to the server will help debug issues with transcription:

- Language detection logs will show what language Deepgram detected
- Detailed error logs will provide more information about transcription failures
- Full transcription results are logged for inspection

## Supported Audio Formats

The following audio formats are supported:
- flac
- m4a
- mp3
- mp4
- mpeg
- mpga
- oga
- ogg
- wav
- webm
