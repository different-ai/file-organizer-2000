import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function HelpScreen() {
  const router = useRouter();

  const openiOSShortcutLink = async () => {
    await Linking.openURL('https://www.icloud.com/shortcuts/06915768862848fb9711f2f19b6405e2');
  };

  const openYouTubeSetupVideo = async () => {
    await Linking.openURL('https://youtu.be/zWJgIRlDWkk?si=HSeOUKaMfJvaLtKI');
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: 'Help & Tips',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note Companion Sharing</Text>
            <Text style={styles.sectionText}>
              Share files, images, and text from any app to Note Companion to automatically process and organize your content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Share Files</Text>
            <View style={styles.card}>
              <View style={styles.instructionItem}>
                <MaterialIcons name="touch-app" size={24} color="#007AFF" />
                <View style={styles.instructionText}>
                  <Text style={styles.instructionTitle}>From Any App</Text>
                  <Text style={styles.instructionDescription}>
                    Tap the share button in any app and select "Note Companion" from the share sheet
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <MaterialIcons name="upload-file" size={24} color="#007AFF" />
                <View style={styles.instructionText}>
                  <Text style={styles.instructionTitle}>From the Home Tab</Text>
                  <Text style={styles.instructionDescription}>
                    Use the upload buttons on the home screen to select files, photos, or take pictures
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <MaterialIcons name="create" size={24} color="#007AFF" />
                <View style={styles.instructionText}>
                  <Text style={styles.instructionTitle}>From Apple Notes</Text>
                  <Text style={styles.instructionDescription}>
                    Use our iOS Shortcut to quickly send Apple Notes to your Obsidian vault
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>iOS Shortcut for Apple Notes</Text>
            <Text style={styles.sectionText}>
              We've created a special iOS Shortcut that makes it easy to send Apple Notes to your Obsidian vault.
            </Text>
            
            <View style={styles.shortcutCard}>
              <TouchableOpacity style={styles.shortcutButton} onPress={openiOSShortcutLink}>
                <MaterialIcons name="ios-share" size={24} color="#fff" />
                <Text style={styles.shortcutButtonText}>Get iOS Shortcut</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.videoButton} onPress={openYouTubeSetupVideo}>
                <MaterialIcons name="ondemand-video" size={22} color="#007AFF" />
                <Text style={styles.videoButtonText}>Watch Setup Video</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.notesText}>
              Notes:
            </Text>
            <View style={styles.noteItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.noteText}>
                Works when your vault is on a cloud drive (iCloud recommended)
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialIcons name="warning" size={16} color="#FFC107" />
              <Text style={styles.noteText}>
                Currently only works if your iOS is in English (reach out on Discord for other languages)
              </Text>
            </View>
            <View style={styles.noteItem}>
              <MaterialIcons name="info" size={16} color="#007AFF" />
              <Text style={styles.noteText}>
                Doesn't work with OneDrive as of last testing
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need More Help?</Text>
            <TouchableOpacity style={styles.supportButton} onPress={() => Linking.openURL('https://discord.gg/yourserverlinkhere')}>
              <MaterialIcons name="support-agent" size={22} color="#fff" />
              <Text style={styles.supportButtonText}>Join Our Discord</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  instructionText: {
    marginLeft: 12,
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  shortcutCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
  },
  shortcutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 12,
  },
  shortcutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  videoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  notesText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 