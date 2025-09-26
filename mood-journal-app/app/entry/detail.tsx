import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { apiService } from "../../service/api";
import { MoodEntry } from "../../types/store";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";

const triggerIcons: { [key: string]: string } = {
  work: "briefcase-outline",
  relationships: "heart-outline",
  health: "fitness-outline",
  family: "home-outline",
  finances: "card-outline",
  weather: "partly-sunny-outline",
  sleep: "moon-outline",
  exercise: "barbell-outline",
};

export default function EntryDetailScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = React.useState<MoodEntry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const getMoodColor = (emotion: string): string => {
    const colors: { [key: string]: string } = {
      happy: "#4CAF50",
      sad: "#FF5722",
      neutral: "#FFC107",
      angry: "#F44336",
      anxious: "#FF9800",
    };
    return colors[emotion] || "#FFC107";
  };

  const playAudio = async () => {
    if (!entry?.audio_file) return;

    try {
      setAudioLoading(true);

      // Stop current sound if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
      });

      // Get audio URL with authentication token
      const audioUrl = `${apiService.getBaseURL()}/api/audio/${
        entry.audio_file.filename
      }`;

      // Create and load sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        {
          uri: audioUrl,
          headers: {
            Authorization: `Bearer ${await apiService.getAuthToken()}`,
          },
        },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert("Error", "Failed to play audio. Please try again.");
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    }
  };

  useEffect(() => {
    const fetchEntry = async () => {
      if (!entryId) return;

      try {
        const response = await apiService.getEntry(entryId);
        setEntry(response.entry);
      } catch (error) {
        console.error("Failed to fetch entry:", error);
        Alert.alert("Error", "Failed to load entry details. Please try again.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading entry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    // For now, just show an alert since we don't have edit functionality
    Alert.alert("Edit Entry", "Edit functionality coming soon!");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this mood entry? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteEntry(entryId);
              Alert.alert("Deleted", "Your mood entry has been deleted.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Failed to delete entry:", error);
              Alert.alert("Error", "Failed to delete entry. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Display */}
        <View style={styles.moodContainer}>
          <Text style={styles.moodEmoji}>{entry.mood?.emoji || "😐"}</Text>
          <View style={styles.emotionDisplay}>
            <View
              style={[
                styles.emotionBadge,
                {
                  backgroundColor: getMoodColor(
                    entry.mood?.emotion || "neutral"
                  ),
                },
              ]}
            >
              <Text style={styles.emotionText}>
                {entry.mood?.emotion.charAt(0).toUpperCase() +
                  entry.mood?.emotion.slice(1) || "Unknown"}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(entry.entry_date)}</Text>
          <Text style={styles.timeText}>{formatTime(entry.entry_date)}</Text>
        </View>

        {/* Notes */}
        {entry.text_note && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.noteText}>{entry.text_note}</Text>
          </View>
        )}

        {/* Audio Note */}
        {entry.audio_file && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="musical-notes" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Voice Note</Text>
            </View>
            <View style={styles.audioPlayer}>
              <TouchableOpacity
                style={[
                  styles.audioPlayButton,
                  isPlaying ? styles.audioPlayButtonPlaying : null,
                ]}
                onPress={isPlaying ? stopAudio : playAudio}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </TouchableOpacity>
              <View style={styles.audioInfo}>
                <Text style={styles.audioTitle}>
                  {isPlaying ? "Playing..." : "Voice Note"}
                </Text>
                <Text style={styles.audioDuration}>
                  {entry.audio_file.duration
                    ? `${Math.round(entry.audio_file.duration)}s`
                    : "Unknown duration"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Insight */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>AI Insight</Text>
          </View>
          {entry.ai_processed && entry.ai_insight ? (
            <Text style={styles.insightText}>{entry.ai_insight}</Text>
          ) : entry.ai_processing_failed ? (
            <View style={styles.insightError}>
              <Ionicons name="warning-outline" size={20} color={COLORS.error} />
              <Text style={styles.insightErrorText}>
                Failed to generate insight
                {entry.ai_error_message && `: ${entry.ai_error_message}`}
              </Text>
            </View>
          ) : (
            <View style={styles.insightLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.insightLoadingText}>
                Generating insight...
              </Text>
            </View>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Details</Text>
          </View>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Created:</Text>
              <Text style={styles.metadataValue}>
                {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
              </Text>
            </View>
            {entry.updated_at && entry.updated_at !== entry.created_at && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Last updated:</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(entry.updated_at)} at{" "}
                  {formatTime(entry.updated_at)}
                </Text>
              </View>
            )}
            {entry.local_id && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Local ID:</Text>
                <Text style={styles.metadataValue}>{entry.local_id}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.base,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  moodContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  moodEmoji: {
    fontSize: 80,
    marginBottom: SPACING.base,
  },
  emotionDisplay: {
    marginBottom: SPACING.base,
  },
  emotionBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  emotionText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    textAlign: "center",
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  noteText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  insightText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: 24,
    color: COLORS.textPrimary,
    fontStyle: "italic",
  },
  insightLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.base,
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  insightLoadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontStyle: "italic",
  },
  insightError: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.base,
    backgroundColor: COLORS.error + "10",
    borderRadius: BORDER_RADIUS.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  insightErrorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    flex: 1,
  },
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.base,
    gap: SPACING.base,
  },
  audioPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  audioPlayButtonPlaying: {
    backgroundColor: COLORS.primary + "CC", // Slightly transparent when playing
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  audioDuration: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  metadataContainer: {
    gap: SPACING.sm,
  },
  metadataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metadataLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  metadataValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.base,
  },
});
