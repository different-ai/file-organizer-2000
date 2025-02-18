import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { API_URL } from "@/constants/config";
import * as FileSystem from 'expo-file-system';

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

interface UploadResult {
  status: UploadStatus;
  text?: string;
  error?: string;
}

// Define the type for the file upload
interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

// Add this type definition at the top of the file, after imports
interface FileUpload {
  uri: string;
  type: string;
  name: string;
}

// Add these interfaces at the top with the other interfaces
interface UploadResponse {
  success: boolean;
  fileId: number;
  status: string;
}

export default function FileUploadScreen() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const { getToken } = useAuth();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled) {
        return;
      }

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

      if (result.canceled) {
        return;
      }

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
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setUploadResult({ status: "error", error: "Camera permission denied" });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images" as ImagePicker.MediaType,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error("Error taking photo:", error);
      setUploadResult({ status: "error", error: "Failed to take photo" });
    }
  };

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

      // Get the file extension from the URI
      const uriParts = file.uri.split(".");
      const fileExtension = uriParts[uriParts.length - 1];

      // Generate a filename if not provided
      const fileName = file.name || `upload.${fileExtension}`;

      // Determine mime type
      const mimeType =
        file.mimeType ||
        (fileExtension === "pdf"
          ? "application/pdf"
          : `image/${fileExtension}`);

      // Handle file URI for iOS and Android
      const fileUri = Platform.select({
        ios: file.uri,  // Don't remove file:// prefix for iOS
        android: file.uri,
        default: file.uri,
      });

      // Create the file data object
      const fileData = {
        name: fileName,
        type: mimeType,
        // Convert file to base64
        base64: await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        }),
      };

      console.log('Uploading file:', { name: fileName, type: mimeType });

      // Use fetch with JSON
      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fileData),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json() as UploadResponse;
      setStatus("processing");

      // Step 2: Process file
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

      const processData = await processResponse.json();

      // Step 3: Poll for results
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
    const maxAttempts = 30; // 1 minute max (2s intervals)

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

      if (data.error) {
        return { status: "error", error: data.error };
      }

      if (data.status === "completed") {
        return { status: "completed", text: data.text };
      }

      if (data.status === "error") {
        return { status: "error", error: data.error };
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }

    return { status: "error", error: "Processing timeout" };
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickDocument}
          disabled={status === "uploading" || status === "processing"}
        >
          <MaterialIcons name="file-upload" size={24} color="white" />
          <Text style={styles.buttonText}>Pick Document</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={pickPhotos}
          disabled={status === "uploading" || status === "processing"}
        >
          <MaterialIcons name="photo-library" size={24} color="white" />
          <Text style={styles.buttonText}>Pick Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={takePhoto}
          disabled={status === "uploading" || status === "processing"}
        >
          <MaterialIcons name="camera-alt" size={24} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {(status === "uploading" || status === "processing") && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>
            {status === "uploading" ? "Uploading..." : "Processing..."}
          </Text>
        </View>
      )}

      {uploadResult && (
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.statusText,
              uploadResult.status === "completed"
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {uploadResult.status === "completed" ? "Completed" : "Error"}
          </Text>

          {uploadResult.error ? (
            <Text style={styles.errorText}>{uploadResult.error}</Text>
          ) : uploadResult.text ? (
            <View style={styles.textContainer}>
              <Text style={styles.label}>Extracted Text:</Text>
              <Text style={styles.extractedText}>{uploadResult.text}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    minWidth: 100,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  textContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  extractedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  errorText: {
    color: "#f44336",
    fontWeight: "600",
  },
});
