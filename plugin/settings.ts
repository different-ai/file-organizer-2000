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
  fabricPaths = "_FileOrganizer2000/Fabric";
  bypassedFilePath = "_FileOrganizer2000/Bypassed";
  errorFilePath = "_FileOrganizer2000/Errors";


  useSimilarTags = true;
  renameInstructions = "Create a concise, descriptive name for the document based on its key content. Prioritize clarity and searchability, using specific terms that will make the document easy to find later. Avoid generic words and focus on unique, identifying elements.";
  usePro = true;
  useSimilarTagsInFrontmatter = false;
  enableAtomicNotes = false;
  enableSimilarFiles = false;
  enableDocumentClassification = false;
  ignoreFolders = [""];
  stagingFolder = ".fileorganizer2000/staging";
  openAIApiKey = "";
  enableSelfHosting = false;
  selfHostingURL = "http://localhost:3000";
  enableScreenpipe = false;
  enableFabric = false;
  useFolderEmbeddings = false;
  useVaultTitles = true;
  enableFileRenaming = true;
  showLocalLLMInChat = false;
  customFolderInstructions = "";
  selectedModel: "gpt-4o" | "llama3.2" = "gpt-4o";
  tagScoreThreshold = 70;
  formatBehavior: "override" | "newFile" = "override";
  useInbox = false;
  imageInstructions = "Analyze the image and provide a clear, detailed description focusing on the main elements, context, and any text visible in the image. Include relevant details that would be useful for searching and organizing the image later.";
}

export const DEFAULT_SETTINGS = new FileOrganizerSettings();
