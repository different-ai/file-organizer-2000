import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SharedFileViewerProps {
  fileUri?: string;
}

export const SharedFileViewer: React.FC<SharedFileViewerProps> = ({ fileUri }) => {
  if (!fileUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No file shared</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shared File:</Text>
      <Text style={styles.fileUri}>{fileUri}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  fileUri: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 