import React, { useEffect } from "react";
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
import { apiService } from "../../service/api";
import { MoodEntry } from "../../types/store";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: COLORS.textSecondary }}>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    Alert.alert("Coming Soon", "Edit functionality will be available soon.");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this mood entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteEntry(entryId!);
              Alert.alert(
                "Entry Deleted",
                "Your mood entry has been deleted.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error) {
              console.error("Failed to delete entry:", error);
              Alert.alert("Error", "Failed to delete entry. Please try again.");
            }
          },
        },
      ]
    );
  };

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
      hour12: true,
    });
  };

  const moodColor = getMoodColor(entry.mood?.emotion || "neutral");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Entry</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Display */}
        <View style={styles.moodSection}>
          <View style={[styles.moodContainer, { borderColor: moodColor }]}>
            <Text style={styles.moodEmoji}>{entry.mood?.emoji || "😐"}</Text>
            <Text style={[styles.moodLabel, { color: moodColor }]}>
              {entry.mood?.emotion.charAt(0).toUpperCase() +
                entry.mood?.emotion.slice(1) || "Unknown"}
            </Text>
          </View>

          {/* Mood Info */}
          <View style={styles.intensitySection}>
            <Text style={styles.intensityLabel}>Emotion</Text>
            <View style={styles.emotionDisplay}>
              <View
                style={[
                  styles.emotionBadge,
                  { backgroundColor: moodColor + "20", borderColor: moodColor },
                ]}
              >
                <Text style={[styles.emotionText, { color: moodColor }]}>
                  {entry.mood?.emotion.charAt(0).toUpperCase() +
                    entry.mood?.emotion.slice(1) || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Date & Time</Text>
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

        {/* Metadata */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Entry Details</Text>
          </View>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>
                {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Entry ID</Text>
              <Text style={styles.metadataValue}>{entry.id}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionCard} onPress={handleEdit}>
            <Ionicons name="pencil" size={24} color={COLORS.primary} />
            <Text style={styles.actionCardText}>Edit Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
            <Text style={styles.actionCardText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.deleteCard]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
            <Text style={[styles.actionCardText, styles.deleteCardText]}>
              Delete
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  moodSection: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.base,
  },
  moodContainer: {
    alignItems: "center",
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    backgroundColor: COLORS.white,
    ...SHADOWS.base,
  },
  moodEmoji: {
    fontSize: 64,
    marginBottom: SPACING.base,
  },
  moodLabel: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  intensitySection: {
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  intensityLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  intensityDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray[300],
  },
  intensityDotActive: {
    backgroundColor: COLORS.primary,
  },
  emotionDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  emotionBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  emotionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  triggersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  triggerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  triggerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  noteText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.base,
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
    fontWeight: "600",
  },
  metadataValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "right",
  },
  actionsSection: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  deleteCard: {
    backgroundColor: COLORS.error + "10",
  },
  actionCardText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  deleteCardText: {
    color: COLORS.error,
  },
});
