import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useShareIntent } from "expo-share-intent";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProcessingStatus } from "@/components/processing-status";
import { 
  SharedFile, 
  UploadStatus, 
  UploadResult, 
  handleFileProcess 
} from "@/utils/file-handler";

export default function HomeScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const params = useLocalSearchParams<{ sharedFile?: string }>();
  const { shareIntent } = useShareIntent();

  useEffect(() => {
    // Handle shared content
    const handleSharedContent = async () => {
      if (shareIntent) {
        try {
          if (shareIntent.files && shareIntent.files.length > 0) {
            // Handle shared files
            const file = shareIntent.files[0];
            await uploadFile({
              uri: file.path,
              mimeType: file.mimeType,
              name: file.fileName,
            });
          } else if (shareIntent.text) {
            // Handle shared text (could save as markdown or process differently)
            const textFile = {
              uri: `${FileSystem.cacheDirectory}shared-text-${Date.now()}.md`,
              mimeType: 'text/markdown',
              name: 'shared-text.md',
              text: shareIntent.text
            };
            
            await uploadFile(textFile);
          }
        } catch (error) {
          console.error('Error handling shared content:', error);
          setUploadResult({
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process shared content'
          });
          setStatus('error');
        }
      }
    };

    handleSharedContent();
  }, [shareIntent]);

  useEffect(() => {
    // Handle shared file if present
    const handleSharedFile = async () => {
      if (params.sharedFile) {
        try {
          const fileData = JSON.parse(params.sharedFile);
          await uploadFile(fileData);
        } catch (error) {
          console.error('Error handling shared file:', error);
          setUploadResult({
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process shared file'
          });
          setStatus('error');
        }
      }
    };

    handleSharedFile();
  }, [params.sharedFile]);

  const uploadFile = async (file: SharedFile) => {
    try {
      // Reset state
      setStatus("idle");
      setUploadResult(null);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Process the file using our shared utility
      const result = await handleFileProcess(
        file,
        token,
        (newStatus) => setStatus(newStatus)
      );

      // Update state with the result
      setUploadResult(result);
      setStatus(result.status);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
      setStatus("error");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled) return;
      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error("Error picking document:", error);
      setUploadResult({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Failed to pick document" 
      });
      setStatus("error");
    }
  };

  const pickPhotos = async () => {
    try {
      const { status: permissionStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionStatus !== "granted") {
        setUploadResult({
          status: "error",
          error: "Gallery permission denied",
        });
        setStatus("error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      // Upload the first selected photo for now
      // TODO: Add support for multiple file uploads
      if (result.assets.length > 0) {
        await uploadFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking photos:", error);
      setUploadResult({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Failed to pick photos" 
      });
      setStatus("error");
    }
  };

  const takePhoto = async () => {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        setUploadResult({ 
          status: "error", 
          error: "Camera permission denied" 
        });
        setStatus("error");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;
      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error("Error taking photo:", error);
      setUploadResult({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Failed to take photo" 
      });
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setUploadResult(null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <MaterialIcons name="folder" size={48} color="#007AFF" />
      <Text style={styles.title}>Note Companion</Text>
      <Text style={styles.subtitle}>AI-powered document organization</Text>
    </View>
  );

  const renderExplanation = () => (
    <View style={styles.explanationCard}>
      <MaterialIcons name="auto-awesome" size={24} color="#007AFF" />
      <Text style={styles.explanationTitle}>
        Get OCR from any image or pdf
      </Text>
      <Text style={styles.explanationText}>
        Upload any image or pdf and get the text extracted. You can also use
        the share sheet to upload from other apps.
      </Text>
    </View>
  );

  const renderUploadButtons = () => (
    <View style={styles.uploadButtons}>
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
        ]}
        onPress={pickDocument}
        disabled={status !== "idle" && status !== "completed" && status !== "error"}
      >
        <View style={styles.uploadButtonContent}>
          <MaterialIcons name="file-upload" size={32} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Upload File</Text>
          <Text style={styles.uploadButtonSubtext}>PDF or Image</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
        ]}
        onPress={pickPhotos}
        disabled={status !== "idle" && status !== "completed" && status !== "error"}
      >
        <View style={styles.uploadButtonContent}>
          <MaterialIcons name="photo-library" size={32} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Photo Library</Text>
          <Text style={styles.uploadButtonSubtext}>Choose Photos</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          (status !== "idle" && status !== "completed" && status !== "error") && styles.uploadButtonDisabled,
        ]}
        onPress={takePhoto}
        disabled={status !== "idle" && status !== "completed" && status !== "error"}
      >
        <View style={styles.uploadButtonContent}>
          <MaterialIcons name="camera-alt" size={32} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
          <Text style={styles.uploadButtonSubtext}>Document or Note</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHelpLink = () => (
    <TouchableOpacity
      style={styles.helpLink}
      onPress={() => router.push('/help')}
    >
      <MaterialIcons name="help-outline" size={18} color="#007AFF" />
      <Text style={styles.helpLinkText}>Need help with sharing?</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainSection}>
        {renderHeader()}
        {renderExplanation()}
        {renderUploadButtons()}
        
        <ProcessingStatus
          status={status}
          result={uploadResult?.text || uploadResult?.error}
          onRetry={handleRetry}
          showDetails={true}
        />

        {renderHelpLink()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  mainSection: {
    padding: 20,
  },
  explanationCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    color: "#1a1a1a",
  },
  explanationText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  uploadButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  uploadButtonContent: {
    alignItems: "center",
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  uploadButtonSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
});
