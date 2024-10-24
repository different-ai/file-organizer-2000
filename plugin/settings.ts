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
  usePro = true;
  useSimilarTagsInFrontmatter = false;
  processedTag = false;
  enableAliasGeneration = false;
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
  fabricPatternPath = "_FileOrganizer2000/Fabric";
  useFolderEmbeddings = false;
  useVaultTitles = true;
  enableFileRenaming = true;
  showLocalLLMInChat = false;
  enableCustomFolderInstructions = false;
  customFolderInstructions = "";
  selectedModel: "gpt-4o" | "llama3.2" = "gpt-4o";
}

export const DEFAULT_SETTINGS = new FileOrganizerSettings();
