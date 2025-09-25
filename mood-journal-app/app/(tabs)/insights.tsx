import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../../service/api";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";

const { width } = Dimensions.get("window");


export default function InsightsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");
  const [stats, setStats] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const periods = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  const fetchInsights = async () => {
    try {
      const [statsResponse, summaryResponse] = await Promise.all([
        apiService.getMoodStats(),
        apiService.getWeeklySummary(),
      ]);
      setStats(statsResponse.stats);
      setWeeklySummary(summaryResponse);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      // Use fallback mock data if API fails
      // setStats(mockInsights.weeklyOverview);
      setWeeklySummary({ summary: "No summary available" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const renderMoodDistribution = () => {
    if (!stats?.mood_distribution) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Mood Distribution</Text>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const distributionData = Object.entries(stats.mood_distribution).map(
      ([mood, count]) => ({
        mood,
        count: count as number,
        emoji: getMoodEmoji(mood),
        color: getMoodColor(mood),
      })
    );

    const maxCount = Math.max(...distributionData.map((m) => m.count));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mood Distribution</Text>
        <View style={styles.moodChart}>
          {distributionData.map((mood) => (
            <View key={mood.mood} style={styles.moodBar}>
              <View style={styles.moodBarContainer}>
                <View
                  style={[
                    styles.moodBarFill,
                    {
                      height: `${(mood.count / maxCount) * 100}%`,
                      backgroundColor: mood.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodCount}>{mood.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return "warning-outline";
      case "pattern":
        return "trending-up-outline";
      case "correlation":
        return "link-outline";
      default:
        return "bulb-outline";
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "trigger":
        return COLORS.error;
      case "pattern":
        return COLORS.primary;
      case "correlation":
        return "#4CAF50";
      default:
        return COLORS.textSecondary;
    }
  };

  const getMoodEmoji = (emotion: string): string => {
    const moodEmojiMap: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      neutral: "😐",
      angry: "😡",
      anxious: "😰",
    };
    return moodEmojiMap[emotion] || "😐";
  };

  const getMoodColor = (emotion: string): string => {
    const moodColorMap: { [key: string]: string } = {
      happy: "#4CAF50",
      sad: "#FF5722",
      neutral: "#FFC107",
      angry: "#F44336",
      anxious: "#FF9800",
    };
    return moodColorMap[emotion] || "#FFC107";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value
                  ? styles.periodButtonActive
                  : null,
              ]}
              onPress={() => setSelectedPeriod(period.value as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value
                    ? styles.periodButtonTextActive
                    : null,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons
                name="journal-outline"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.statNumber}>{stats?.total_entries || 0}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="happy-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>
              {stats?.average_mood?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>Avg. Mood</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>
              {weeklySummary?.entries_count || 0}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Mood Distribution Chart */}
        <View style={styles.section}>{renderMoodDistribution()}</View>

        {/* AI Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={12} color={COLORS.primary} />
              <Text style={styles.aiTagText}>AI Generated</Text>
            </View>
          </View>

          {weeklySummary?.summary ? (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: COLORS.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Weekly Analysis</Text>
                  <Text style={styles.insightDescription}>
                    {weeklySummary.summary}
                  </Text>
                </View>
              </View>
            </View>
          ) : loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Generating insights...</Text>
            </View>
          ) : (
            <View style={styles.insightCard}>
              <Text style={styles.noDataText}>
                Create more entries to see AI-generated insights!
              </Text>
            </View>
          )}
        </View>

        {/* Period Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period Summary</Text>

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakIconContainer}>
                <Ionicons name="calendar" size={32} color="#FF6B35" />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>
                  {stats?.period || "This Week"}
                </Text>
                <Text style={styles.streakLabel}>Current Period</Text>
              </View>
            </View>

            <View style={styles.streakStats}>
              <View style={styles.streakStat}>
                <Text style={styles.streakStatNumber}>
                  {stats?.total_entries || 0}
                </Text>
                <Text style={styles.streakStatLabel}>Total Entries</Text>
              </View>
              <View style={styles.streakStat}>
                <Text style={styles.streakStatNumber}>
                  {stats?.recent_trend || "Stable"}
                </Text>
                <Text style={styles.streakStatLabel}>Trend</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons
              name="download-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.exportButtonText}>Export Your Data</Text>
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
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  helpButton: {
    padding: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: COLORS.primary + "15",
    gap: 4,
  },
  aiTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
    textAlign: "center",
  },
  moodChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    paddingHorizontal: SPACING.sm,
  },
  moodBar: {
    flex: 1,
    alignItems: "center",
    gap: SPACING.xs,
  },
  moodBarContainer: {
    flex: 1,
    width: "80%",
    justifyContent: "flex-end",
  },
  moodBarFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    minHeight: 8,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  insightHeader: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  insightDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.sm,
  },
  insightRecommendation: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  recommendationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.lineHeight.sm,
  },
  streakCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  streakIconContainer: {
    marginRight: SPACING.base,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  streakLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  streakStats: {
    flexDirection: "row",
    gap: SPACING.lg,
  },
  streakStat: {
    alignItems: "center",
  },
  streakStatNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  streakStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  exportButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.primary,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
});
