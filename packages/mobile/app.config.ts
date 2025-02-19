import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Note Companion AI',
  slug: 'note-companion',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.notecompanion.app',
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      NSPhotoLibraryUsageDescription: "We need access to your photos to upload and process them.",
      NSCameraUsageDescription: "We need access to your camera to take photos of documents.",
      LSApplicationQueriesSchemes: ["obsidian"],
      CFBundleURLTypes: [{
        CFBundleURLSchemes: ["notecompanion"]
      }],
      NSUserActivityTypes: [
        "INSendMessageIntent",
        "INSearchForMessagesIntent"
      ],
      UIFileSharingEnabled: true,
      LSSupportsOpeningDocumentsInPlace: true,
      UISupportsDocumentBrowser: true,
      CFBundleDocumentTypes: [{
        CFBundleTypeName: "All Files",
        LSHandlerRank: "Alternate",
        LSItemContentTypes: [
          "public.content",
          "public.data",
          "public.image",
          "public.pdf",
          "public.text",
          "public.audio",
          "public.movie",
          "com.adobe.pdf",
          "com.microsoft.word.doc",
          "org.openxmlformats.wordprocessingml.document",
          "public.plain-text",
          "public.html"
        ]
      }],
      UTExportedTypeDeclarations: [{
        UTTypeIdentifier: "com.notecompanion.app",
        UTTypeDescription: "Note Companion Document",
        UTTypeConformsTo: ["public.data"],
        UTTypeTagSpecification: {
          "public.filename-extension": ["pdf", "jpg", "jpeg", "png", "webp", "txt", "md", "doc", "docx", "html"],
          "public.mime-type": [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/plain",
            "text/markdown",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/html"
          ]
        }
      }]
    },
    usesIcloudStorage: true,
    associatedDomains: ['applinks:notecompanion.app'],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.notecompanion.app',
    intentFilters: [
      {
        action: "android.intent.action.SEND",
        category: ["android.intent.category.DEFAULT"],
        data: [
          { mimeType: "application/pdf" },
          { mimeType: "image/*" },
          { mimeType: "text/plain" },
          { mimeType: "text/markdown" },
          { mimeType: "text/html" },
          { mimeType: "application/msword" },
          { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
        ]
      },
      {
        action: "android.intent.action.SEND_MULTIPLE",
        category: ["android.intent.category.DEFAULT"],
        data: [
          { mimeType: "application/pdf" },
          { mimeType: "image/*" },
          { mimeType: "text/plain" },
          { mimeType: "text/markdown" },
          { mimeType: "text/html" },
          { mimeType: "application/msword" },
          { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
        ]
      }
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-file-system',
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production'
      }
    ],
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsText: true,
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsImageWithMaxCount: 1,
          NSExtensionActivationSupportsFileWithMaxCount: 1,
          NSExtensionActivationSupportsMovieWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1
        },
        androidMimeTypes: [
          "text/*",
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/markdown",
          "text/html"
        ]
      }
    ]
  ],
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  },
  scheme: 'notecompanion'
}); 