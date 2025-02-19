import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useShareIntent } from "expo-share-intent";
import { API_URL } from "@/constants/config";
import { useLocalSearchParams } from 'expo-router';

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

interface UploadResult {
  status: UploadStatus;
  text?: string;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  fileId: number;
  status: string;
}

export default function HomeScreen() {
  const { getToken } = useAuth();
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
              name: 'shared-text.md'
            };
            
            await FileSystem.writeAsStringAsync(textFile.uri, shareIntent.text);
            await uploadFile(textFile);
          }
        } catch (error) {
          console.error('Error handling shared content:', error);
          setUploadResult({
            status: 'error',
            error: 'Failed to process shared content'
          });
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
            error: 'Failed to process shared file'
          });
        }
      }
    };

    handleSharedFile();
  }, [params.sharedFile]);

  const uploadFile = async (file: {
    uri: string;
    mimeType?: string;
    name?: string;
  }) => {
    try {
      setStatus("uploading");
      setUploadResult(null);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const uriParts = file.uri.split(".");
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      const fileName = file.name || `upload.${fileExtension}`;
      
      let mimeType = file.mimeType;
      if (!mimeType) {
        switch (fileExtension) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
      }

      const fileUri = Platform.select({
        ios: file.uri.replace('file://', ''),
        android: file.uri,
        default: file.uri,
      });

      if (Platform.OS === 'ios') {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
      }

      const fileData = {
        name: fileName,
        type: mimeType,
        base64: await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      };

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fileData),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = (await uploadResponse.json()) as UploadResponse;
      setStatus("processing");

      const processResponse = await fetch(`${API_URL}/api/process-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: uploadData.fileId }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse
          .json()
          .catch(() => ({ error: "Processing failed" }));
        throw new Error(errorData.error || "Processing failed");
      }

      const result = await pollForResults(uploadData.fileId, token);
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

  const pollForResults = async (
    fileId: number,
    token: string
  ): Promise<UploadResult> => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `${API_URL}/api/file-status?fileId=${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.error) return { status: "error", error: data.error };
      if (data.status === "completed")
        return { status: "completed", text: data.text };
      if (data.status === "error")
        return { status: "error", error: data.error };

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    return { status: "error", error: "Processing timeout" };
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
      setUploadResult({ status: "error", error: "Failed to pick document" });
    }
  };

  const pickPhotos = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setUploadResult({
          status: "error",
          error: "Gallery permission denied",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as ImagePicker.MediaType,
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
      setUploadResult({ status: "error", error: "Failed to pick photos" });
    }
  };

  const takePhoto = async () => {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        setUploadResult({ status: "error", error: "Camera permission denied" });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images" as ImagePicker.MediaType,
        quality: 0.8,
      });

      if (result.canceled) return;
      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error("Error taking photo:", error);
      setUploadResult({ status: "error", error: "Failed to take photo" });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="folder" size={48} color="#007AFF" />
        <Text style={styles.title}>Note Companion</Text>
        <Text style={styles.subtitle}>AI-powered document organization </Text>
      </View>

      <View style={styles.mainSection}>
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

        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              status !== "idle" && styles.uploadButtonDisabled,
            ]}
            onPress={pickDocument}
            disabled={status !== "idle"}
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
              status !== "idle" && styles.uploadButtonDisabled,
            ]}
            onPress={pickPhotos}
            disabled={status !== "idle"}
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
              status !== "idle" && styles.uploadButtonDisabled,
            ]}
            onPress={takePhoto}
            disabled={status !== "idle"}
          >
            <View style={styles.uploadButtonContent}>
              <MaterialIcons name="camera-alt" size={32} color="#007AFF" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
              <Text style={styles.uploadButtonSubtext}>Document or Note</Text>
            </View>
          </TouchableOpacity>
        </View>

        {(status === "uploading" || status === "processing") && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>
              {status === "uploading"
                ? "Uploading your file..."
                : "AI is processing your document..."}
            </Text>
            <Text style={styles.statusSubtext}>
              {status === "uploading"
                ? "This will just take a moment"
                : "Extracting text and organizing content"}
            </Text>
          </View>
        )}

        {uploadResult && (
          <View
            style={[
              styles.resultContainer,
              uploadResult.status === "completed"
                ? styles.successContainer
                : styles.errorContainer,
            ]}
          >
            <MaterialIcons
              name={
                uploadResult.status === "completed" ? "check-circle" : "error"
              }
              size={24}
              color={
                uploadResult.status === "completed" ? "#4CAF50" : "#f44336"
              }
            />
            <View style={styles.resultTextContainer}>
              <Text
                style={[
                  styles.resultText,
                  uploadResult.status === "completed"
                    ? styles.successText
                    : styles.errorText,
                ]}
              >
                {uploadResult.status === "completed"
                  ? "File processed successfully"
                  : uploadResult.error}
              </Text>
              {uploadResult.status === "completed" && (
                <Text style={styles.resultSubtext}>
                  Your file has been upload to Note Companion AI.

                  You can view it in your document list.

                  It will be automatically synced to any services you have enabled.
                </Text>
              )}
            </View>
          </View>
        )}
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
  statusContainer: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statusSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  successContainer: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  resultTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  successText: {
    color: "#2E7D32",
  },
  errorText: {
    color: "#C62828",
  },
});
