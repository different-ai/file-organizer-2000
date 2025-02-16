declare module 'react-native-share-menu' {
  export interface SharedItem {
    mimeType: string;
    data: string;
    extraData?: any;
  }

  export interface ShareMenuModule {
    getInitialShare(callback: (item: SharedItem | null) => void): void;
    addNewShareListener(callback: (item: SharedItem | null) => void): { remove: () => void };
  }

  const ShareMenu: ShareMenuModule;
  export default ShareMenu;
}
