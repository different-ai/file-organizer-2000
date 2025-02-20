export default {
  name: "File Organizer",
  slug: "file-organizer",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.fileorganizer.app",
    infoPlist: {
      NSPhotoLibraryUsageDescription: "We need access to your photos to save shared files.",
      CFBundleURLTypes: [{
        CFBundleURLSchemes: ["file-organizer"]
      }]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.fileorganizer.app",
    intentFilters: [
      {
        action: "android.intent.action.SEND",
        category: ["android.intent.category.DEFAULT"],
        data: [
          {
            mimeType: "*/*"
          }
        ]
      },
      {
        action: "android.intent.action.SEND_MULTIPLE",
        category: ["android.intent.category.DEFAULT"],
        data: [
          {
            mimeType: "*/*"
          }
        ]
      }
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "react-native-share-menu"
  ],
  extra: {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  }
};
