import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import { apiService } from "../../service/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";
import { MoodEntry } from "../../types/store";

const moodOptions = [
  { emotion: "happy", emoji: "😊", label: "Happy", color: "#4CAF50" },
  { emotion: "sad", emoji: "😢", label: "Sad", color: "#FF5722" },
  { emotion: "neutral", emoji: "😐", label: "Neutral", color: "#FFC107" },
  { emotion: "angry", emoji: "😡", label: "Angry", color: "#F44336" },
  { emotion: "anxious", emoji: "😰", label: "Anxious", color: "#FF9800" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentEntries = async () => {
    if (!user) return;

    try {
      const response = await apiService.getEntries({ limit: 5 });
      setRecentEntries(response.entries);
    } catch (error) {
      console.error("Failed to fetch recent entries:", error);
      Alert.alert("Error", "Failed to load recent entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentEntries();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Helper function to get mood color from emotion
  const getMoodColor = (emotion: string): string => {
    const moodOption = moodOptions.find((m) => m.emotion === emotion);
    return moodOption?.color || "#FFC107";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.first_name || "there"}!</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Mood Check-in */}
        <View style={styles.quickCheckIn}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodOptions}
          >
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.emotion}
                style={[styles.moodOption, { borderColor: mood.color }]}
                onPress={() =>
                  router.push({
                    pathname: "/entry/create",
                    params: { selectedMood: mood.emotion },
                  })
                }
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/entry/create")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>New Entry</Text>
              <Text style={styles.actionSubtitle}>Record your mood</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Implement voice recording
              console.log("Voice recording coming soon");
            }}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mic" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Voice Note</Text>
              <Text style={styles.actionSubtitle}>Record your thoughts</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Recent Entries */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <TouchableOpacity
              onPress={() => {
                // TODO: Navigate to history tab
                console.log("Navigate to history");
              }}
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() =>
                  router.push({
                    pathname: "/entry/detail",
                    params: { entryId: entry.id },
                  })
                }
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryEmoji}>
                    {entry.mood?.emoji || "😐"}
                  </Text>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryMood}>
                      {entry.mood?.emotion.charAt(0).toUpperCase() +
                        entry.mood?.emotion.slice(1) || "Unknown"}
                    </Text>
                    <Text style={styles.entryDate}>
                      {formatDate(entry.entry_date)}
                    </Text>
                  </View>
                </View>
                {entry.text_note && (
                  <Text style={styles.entryNote} numberOfLines={2}>
                    {entry.text_note}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="journal-outline"
                size={48}
                color={COLORS.textTertiary}
              />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your mood by creating your first entry
              </Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  profileButton: {
    padding: SPACING.sm,
  },
  quickCheckIn: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  moodOptions: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  moodOption: {
    alignItems: "center",
    padding: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    backgroundColor: COLORS.white,
    minWidth: 90,
    // maxWidth: 30,
    // ...SHADOWS.sm,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  moodLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  quickActions: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.base,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  recentSection: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  seeAllLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  entryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  entryEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  entryInfo: {
    flex: 1,
  },
  entryMood: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textTransform: "capitalize",
  },
  entryDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  entryNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
  },
});
