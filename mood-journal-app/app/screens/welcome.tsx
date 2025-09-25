import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌈</Text>
            <Text style={styles.logoText}>MoodJournal</Text>
          </View>
          <Text style={styles.subtitle}>
            Track your emotions, discover patterns, and improve your wellbeing
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationCard}>
            <Text style={styles.illustrationEmoji}>😊</Text>
            <Text style={styles.illustrationText}>Daily Mood Tracking</Text>
          </View>
          <View style={styles.illustrationCard}>
            <Text style={styles.illustrationEmoji}>🎤</Text>
            <Text style={styles.illustrationText}>Voice Reflections</Text>
          </View>
          <View style={styles.illustrationCard}>
            <Text style={styles.illustrationEmoji}>🤖</Text>
            <Text style={styles.illustrationText}>AI Insights</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/screens/signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/screens/login')}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: TYPOGRAPHY.lineHeight.lg,
    paddingHorizontal: SPACING.lg,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  illustrationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  illustrationEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  illustrationText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  ctaContainer: {
    paddingBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
});