import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Note Companion AI",
  slug: "note-companion",
  scheme: "notecompanion",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
    dark: {
      image: "./assets/splash-white.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.notecompanion.app",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      CFBundleAllowMixedLocalizations: true,
      NSPhotoLibraryUsageDescription:
        "We need access to your photos to upload and process them.",
      NSCameraUsageDescription:
        "We need access to your camera to take photos of documents.",
      LSApplicationQueriesSchemes: ["obsidian"],
      UIFileSharingEnabled: true,
      LSSupportsOpeningDocumentsInPlace: true,
      UISupportsDocumentBrowser: true,
      CFBundleDocumentTypes: [
        {
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
            "public.html",
          ],
        },
      ],
    },
    usesIcloudStorage: true,
  },
  android: {
    icon: "./assets/icon.png",
    package: "com.notecompanion.app",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#000000",
      },
    },
    intentFilters: [
      {
        action: "android.intent.action.SEND",
        category: ["android.intent.category.DEFAULT"],
        data: [
          { mimeType: "text/*" },
          { mimeType: "image/*" },
          { mimeType: "application/pdf" },
          { mimeType: "application/msword" },
          { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        ],
      },
      {
        action: "android.intent.action.SEND_MULTIPLE",
        category: ["android.intent.category.DEFAULT"],
        data: [
          { mimeType: "text/*" },
          { mimeType: "image/*" },
          { mimeType: "application/pdf" },
          { mimeType: "application/msword" },
          { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        ],
      },
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-file-system",
    [
      "expo-document-picker",
      {
        iCloudContainerEnvironment: "Production",
      },
    ],
    [
      "expo-share-intent",
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
          NSExtensionActivationSupportsImageWithMaxCount: 1,
          NSExtensionActivationSupportsMovieWithMaxCount: 0,
          NSExtensionActivationSupportsText: true,
        },
        androidMimeTypes: [
          "text/*",
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    router: {
      origin: false,
    },
  },
});
