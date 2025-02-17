import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSignIn } from "@clerk/clerk-expo";
import { SignInWithOAuth } from '@/components/SignInWithOAuth';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  if (!isLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SignInWithOAuth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
}); 