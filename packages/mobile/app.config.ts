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
      ]
    },
    usesIcloudStorage: true,
    associatedDomains: ['applinks:notecompanion.app'],
    infoPlist: {
      ...config.ios?.infoPlist,
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
          "public.text"
        ]
      }],
      UTExportedTypeDeclarations: [{
        UTTypeIdentifier: "com.notecompanion.app",
        UTTypeDescription: "Note Companion Document",
        UTTypeConformsTo: ["public.data"],
        UTTypeTagSpecification: {
          "public.filename-extension": ["pdf", "jpg", "jpeg", "png", "webp"],
          "public.mime-type": ["application/pdf", "image/jpeg", "image/png", "image/webp"]
        }
      }]
    }
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
          {
            mimeType: "application/pdf"
          },
          {
            mimeType: "image/*"
          }
        ]
      },
      {
        action: "android.intent.action.SEND_MULTIPLE",
        category: ["android.intent.category.DEFAULT"],
        data: [
          {
            mimeType: "application/pdf"
          },
          {
            mimeType: "image/*"
          }
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
    ]
  ],
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  }
}); 