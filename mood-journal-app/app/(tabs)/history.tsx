import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
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

const groupEntriesByDate = (entries: MoodEntry[]) => {
  const groups: { [key: string]: MoodEntry[] } = {};

  entries.forEach((entry) => {
    const date = new Date(entry.entry_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
  });

  return Object.entries(groups).map(([title, data]) => ({
    title,
    data: data.sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    ),
  }));
};

export default function HistoryScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchEntries = async () => {
    try {
      const response = await apiService.getEntries();
      setEntries(response.entries);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
      Alert.alert("Error", "Failed to load entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (filter === "all") return true;
    return entry.mood?.emotion === filter;
  });

  const groupedEntries = groupEntriesByDate(filteredEntries);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to get mood color
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

  const moodFilters = [
    { value: "all", label: "All", emoji: "📋" },
    { value: "happy", label: "Happy", emoji: "😊" },
    { value: "sad", label: "Sad", emoji: "😢" },
    { value: "neutral", label: "Neutral", emoji: "😐" },
    { value: "angry", label: "Angry", emoji: "😡" },
    { value: "anxious", label: "Anxious", emoji: "😰" },
  ];

  const renderEntry = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() =>
        router.push({
          pathname: "/entry/detail",
          params: { entryId: item.id },
        })
      }
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryMoodInfo}>
          <Text style={styles.entryEmoji}>{item.mood?.emoji || "😐"}</Text>
          <View style={styles.entryDetails}>
            <Text style={styles.entryMood}>
              {item.mood?.emotion.charAt(0).toUpperCase() +
                item.mood?.emotion.slice(1) || "Unknown"}
            </Text>
            <View style={styles.entryMeta}>
              <Text style={styles.entryTime}>
                {formatTime(item.entry_date)}
              </Text>
              <View style={styles.moodIndicator}>
                <View
                  style={[
                    styles.moodColorDot,
                    {
                      backgroundColor: getMoodColor(
                        item.mood?.emotion || "neutral"
                      ),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textTertiary}
        />
      </View>

      {item.text_note && (
        <Text style={styles.entryNote} numberOfLines={2}>
          {item.text_note}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mood History</Text>
        <TouchableOpacity style={styles.statsButton}>
          <Ionicons
            name="stats-chart-outline"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Mood Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {moodFilters.map((moodFilter) => (
          <TouchableOpacity
            key={moodFilter.value}
            style={[
              styles.filterButton,
              filter === moodFilter.value ? styles.filterButtonActive : null,
            ]}
            onPress={() => setFilter(moodFilter.value)}
          >
            <Text style={styles.filterEmoji}>{moodFilter.emoji}</Text>
            <Text
              style={[
                styles.filterLabel,
                filter === moodFilter.value ? styles.filterLabelActive : null,
              ]}
            >
              {moodFilter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries List */}
      {groupedEntries.length > 0 ? (
        <SectionList
          sections={groupedEntries}
          renderItem={renderEntry}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          style={styles.entriesList}
          contentContainerStyle={styles.entriesContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.emptyState}>
            <Ionicons
              name="journal-outline"
              size={64}
              color={COLORS.textTertiary}
            />
            <Text style={styles.emptyTitle}>No entries found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all"
                ? "Start tracking your mood by creating your first entry"
                : `No ${filter} mood entries found. Try a different filter.`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push("/entry/create")}
              >
                <Text style={styles.createButtonText}>Create Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  statsButton: {
    padding: SPACING.sm,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterLabelActive: {
    color: COLORS.white,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  entryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  entryMoodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  entryEmoji: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  entryDetails: {
    flex: 1,
  },
  entryMood: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textTransform: "capitalize",
    marginBottom: SPACING.xs,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  entryTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  intensityDots: {
    flexDirection: "row",
    gap: 2,
  },
  moodIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.sm,
    marginBottom: SPACING.sm,
  },
  triggersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  triggerTag: {
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  triggerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400, // Ensure enough height for pull-to-refresh
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textTertiary,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeight.base,
    marginBottom: SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    ...SHADOWS.base,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "bold",
    color: COLORS.white,
  },
});
