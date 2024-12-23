"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const sdk_1 = require("@deepgram/sdk");
const api_1 = require("@unkey/api");
const morgan_1 = __importDefault(require("morgan"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(__dirname, '..', 'uploads');
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split(".").pop();
        cb(null, `${file.fieldname}-${Date.now()}.${fileExtension}`);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
const deepgram = (0, sdk_1.createClient)(process.env.DEEPGRAM_API_KEY || "");
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        console.log("Request origin:", origin);
        callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((req, res, next) => {
    console.log("Incoming request:", {
        method: req.method,
        path: req.path,
        headers: req.headers,
        origin: req.get("origin"),
    });
    next();
});
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
app.get("/", (req, res) => {
    res.status(200).send("Audio Transcription Server");
});
app.post("/transcribe", upload.single("audio"), async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log("receiving file");
    const authHeader = req.headers["authorization"];
    const key = authHeader === null || authHeader === void 0 ? void 0 : authHeader.toString().replace("Bearer ", "");
    console.log(key);
    if (!key) {
        return res.status(401).send("Unauthorized");
    }
    const { result, error } = await (0, api_1.verifyKey)(key);
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
    const fileExtension = (_a = req.file.filename.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
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
        fs_1.default.unlinkSync(req.file.path);
        return res
            .status(400)
            .json({
            error: `Unsupported file format: ${fileExtension}. Supported formats: ${supportedFormats.join(", ")}`,
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
            const { result, error } = await deepgram.listen.prerecorded.transcribeFile(fs_1.default.readFileSync(chunkPath), {
                model: "nova-2",
                smart_format: true,
                detect_language: true,
            });
            if (error) {
                console.error("Deepgram transcription error:", error);
                throw new Error("Deepgram transcription failed");
            }
            console.log((_d = (_c = (_b = result.results) === null || _b === void 0 ? void 0 : _b.channels[0]) === null || _c === void 0 ? void 0 : _c.alternatives[0]) === null || _d === void 0 ? void 0 : _d.transcript);
            res.write(((_g = (_f = (_e = result.results) === null || _e === void 0 ? void 0 : _e.channels[0]) === null || _f === void 0 ? void 0 : _f.alternatives[0]) === null || _g === void 0 ? void 0 : _g.transcript) + " ");
            fs_1.default.unlinkSync(chunkPath);
        }
        fs_1.default.unlinkSync(req.file.path);
        res.end();
    }
    catch (error) {
        console.error("Error transcribing audio:", error);
        fs_1.default.unlinkSync(req.file.path);
        res
            .status(500)
            .json({
            error: "Error transcribing audio",
            details: error.message,
        });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const execPromise = util_1.default.promisify(child_process_1.exec);
async function getAudioDuration(filePath) {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execPromise(command);
    return { duration: parseFloat(stdout) };
}
async function splitAudio(inputPath, outputPath, start, end) {
    const command = `ffmpeg -i "${inputPath}" -ss ${start} -to ${end} -c copy "${outputPath}"`;
    await execPromise(command);
}
