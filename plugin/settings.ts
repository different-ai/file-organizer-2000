export class FileOrganizerSettings {
  API_KEY = "";
  isLicenseValid = false;
  useLogs = true;
  defaultDestinationPath = "_FileOrganizer2000/Processed";
  attachmentsPath = "_FileOrganizer2000/Processed/Attachments";
  pathToWatch = "_FileOrganizer2000/Inbox";
  logFolderPath = "_FileOrganizer2000/Logs";
  backupFolderPath = "_FileOrganizer2000/Backups";
  templatePaths = "_FileOrganizer2000/Templates";
  useSimilarTags = true;
  renameInstructions = "Create a concise, descriptive name for the document based on its key content. Prioritize clarity and searchability, using specific terms that will make the document easy to find later. Avoid generic words and focus on unique, identifying elements.";
  useAutoAppend = false;
  usePro = true;
  useSimilarTagsInFrontmatter = false;
  processedTag = false;
  enableAliasGeneration = false;
  enableAtomicNotes = false;
  enableSimilarFiles = false;
  enableDocumentClassification = false;
  ignoreFolders = [""];
  stagingFolder = ".fileorganizer2000/staging";
  enableAnthropic = false;
  anthropicApiKey = "";
  anthropicModel = "claude-3-opus-20240229";
  enableOpenAI = true;
  openAIApiKey = "";
  openAIModel = "gpt-4o";
  enableSelfHosting = false;
  enableOllama = false;
  selfHostingURL = "http://localhost:3000";
  taggingModel = "gpt-4o";
  foldersModel = "gpt-4o";
  relationshipsModel = "gpt-4o";
  nameModel = "gpt-4o";
  classifyModel = "gpt-4o";
  visionModel = "gpt-4o";
  formatModel = "gpt-4o";
  ollamaModels: string[] = ["codegemma"];
  openAIBaseUrl = "https://api.openai.com/v1";
  enableScreenpipe = false;
  useVaultTitles = true;
  enableFileRenaming = true;
  userModels: {
    [key: string]: {
      url: string;
      apiKey: string;
      provider: "openai" | "ollama" | "anthropic";
    };
  } = {};
}

export const DEFAULT_SETTINGS = new FileOrganizerSettings();