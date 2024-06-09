
export interface FileMetadata {
    newName: string;
    previousName: string;
    newFolder: string;
    previousFolder: string;
    metadata: {
      content: string;
    };
    shouldCreateNewFolder: boolean;
    moved: boolean;
    originalFolder: string;
    originalName: string;
  }