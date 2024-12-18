import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from 'path';
import cors from "cors";
import { createClient } from "@deepgram/sdk";
import { Readable } from "stream";
import { verifyKey } from "@unkey/api";
import morgan from "morgan";
import { exec } from "child_process";
import util from "util";

dotenv.config();

const app = express();

const storage = multer.diskStorage({
  destination: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const fileExtension = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${Date.now()}.${fileExtension}`);
  },
});

const upload = multer({ storage: storage });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

app.use(morgan("dev"));

app.use(
  cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      console.log("Request origin:", origin);
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    headers: req.headers,
    origin: req.get("origin"),
  });
  next();
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Audio Transcription Server");
});

app.post(
  "/transcribe",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    console.log("receiving file");
    const authHeader = req.headers["authorization"];
    const key = authHeader?.toString().replace("Bearer ", "");
    console.log(key);
    if (!key) {
      return res.status(401).send("Unauthorized");
    }

    const { result, error } = await verifyKey(key);
    console.log(result);
    if (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }

    if (!result.valid) {
      return res.status(401).send("Unauthorized");
    }

    console.log("receiving file");

    if (!req.file) {
      return res.status(400).send("No audio file uploaded.");
    }

    const fileExtension = req.file.filename.split(".").pop()?.toLowerCase();
    const supportedFormats = [
      "flac",
      "m4a",
      "mp3",
      "mp4",
      "mpeg",
      "mpga",
      "oga",
      "ogg",
      "wav",
      "webm",
    ];

    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({
          error: `Unsupported file format: ${fileExtension}. Supported formats: ${supportedFormats.join(
            ", "
          )}`,
        });
    }

    console.log("file extension", fileExtension);

    try {
      const chunkDuration = 10 * 60;
      const audioInfo = await getAudioDuration(req.file.path);
      const totalDuration = audioInfo.duration;
      const chunks = Math.ceil(totalDuration / chunkDuration);

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkDuration;
        const end = Math.min((i + 1) * chunkDuration, totalDuration);

        const chunkPath = `${req.file.path}_chunk_${i}.${fileExtension}`;
        await splitAudio(req.file.path, chunkPath, start, end);
        console.log("in loop");

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
          fs.readFileSync(chunkPath),
          {
            model: "nova-2",
            smart_format: true,
            detect_language: true,
          }
        );

        if (error) {
          console.error("Deepgram transcription error:", error);
          throw new Error("Deepgram transcription failed");
        }

        console.log(result.results?.channels[0]?.alternatives[0]?.transcript);
        res.write(result.results?.channels[0]?.alternatives[0]?.transcript + " ");
        fs.unlinkSync(chunkPath);
      }

      fs.unlinkSync(req.file.path);
      res.end();
    } catch (error) {
      console.error("Error transcribing audio:", error);
      fs.unlinkSync(req.file.path);
      res
        .status(500)
        .json({
          error: "Error transcribing audio",
          details: (error as Error).message,
        });
    }
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const execPromise = util.promisify(exec);
interface AudioInfo {
  duration: number;
}

async function getAudioDuration(filePath: string): Promise<AudioInfo> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const { stdout } = await execPromise(command);
  return { duration: parseFloat(stdout) };
}

async function splitAudio(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number
): Promise<void> {
  const command = `ffmpeg -i "${inputPath}" -ss ${start} -to ${end} -c copy "${outputPath}"`;
  await execPromise(command);
}