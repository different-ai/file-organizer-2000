import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { shareFile, shareText } from '../utils/sharing';

interface ShareButtonProps {
  // The URI of the file to share, or the text content
  content: string;
  // Whether the content is a file URI or text
  isFile?: boolean;
  // Optional filename when sharing text content
  filename?: string;
  // Optional MIME type
  mimeType?: string;
  // Optional style overrides
  style?: ViewStyle;
  // Optional text to display
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  content,
  isFile = true,
  filename = 'shared-content.txt',
  mimeType,
  style,
  label = 'Share'
}) => {
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      if (isFile) {
        await shareFile(content, mimeType);
      } else {
        await shareText(content, filename, mimeType);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Here you might want to show an error message to the user
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleShare}
      disabled={isSharing}
    >
      {isSharing ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 