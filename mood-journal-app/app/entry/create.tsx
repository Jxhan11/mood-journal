import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import { apiService } from "../../service/api";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";

const moodOptions = [
  { emotion: "happy", emoji: "😊", label: "Happy", color: "#4CAF50" },
  { emotion: "sad", emoji: "😢", label: "Sad", color: "#FF5722" },
  { emotion: "neutral", emoji: "😐", label: "Neutral", color: "#FFC107" },
  { emotion: "angry", emoji: "😡", label: "Angry", color: "#F44336" },
  { emotion: "anxious", emoji: "😰", label: "Anxious", color: "#FF9800" },
];

const triggers = [
  { value: "work", label: "Work", icon: "briefcase-outline" },
  { value: "relationships", label: "Relationships", icon: "heart-outline" },
  { value: "health", label: "Health", icon: "fitness-outline" },
  { value: "family", label: "Family", icon: "home-outline" },
  { value: "finances", label: "Finances", icon: "card-outline" },
  { value: "weather", label: "Weather", icon: "partly-sunny-outline" },
  { value: "sleep", label: "Sleep", icon: "moon-outline" },
  { value: "exercise", label: "Exercise", icon: "barbell-outline" },
];

export default function CreateEntryScreen() {
  const router = useRouter();
  const { selectedMood } = useLocalSearchParams<{ selectedMood?: string }>();
  const { isLoading, setLoading } = useStore();

  const [formData, setFormData] = useState({
    selectedEmotion: selectedMood || "",
    note: "",
    triggers: [] as string[],
    date: new Date().toISOString(),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const selectedMoodData = moodOptions.find(
    (m) => m.emotion === formData.selectedEmotion
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.selectedEmotion) {
      newErrors.mood = "Please select your mood";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const entryData = {
        mood: {
          emoji: selectedMoodData?.emoji || "😐",
          emotion: formData.selectedEmotion,
        },
        text_note: formData.note || undefined,
        entry_date: formData.date,
      };

      const response = await apiService.createEntry(entryData);

      Alert.alert(
        "Entry Saved",
        "Your mood entry has been saved successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error saving entry:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save your entry. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setFormData((prev) => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter((t) => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Entry</Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !formData.selectedEmotion ? styles.saveButtonDisabled : null,
            ]}
            onPress={handleSave}
            disabled={!formData.selectedEmotion || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mood Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            {errors.mood && <Text style={styles.errorText}>{errors.mood}</Text>}

            <View style={styles.moodGrid}>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.emotion}
                  style={[
                    styles.moodOption,
                    { borderColor: mood.color },
                    formData.selectedEmotion === mood.emotion
                      ? [
                          styles.moodOptionSelected,
                          { backgroundColor: mood.color + "20" },
                        ]
                      : null,
                  ]}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      selectedEmotion: mood.emotion,
                    }));
                    if (errors.mood) {
                      setErrors((prev) => ({ ...prev, mood: "" }));
                    }
                  }}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      formData.selectedEmotion === mood.emotion
                        ? styles.moodLabelSelected
                        : null,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Display */}
          {formData.selectedEmotion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected Emotion: {selectedMoodData?.label}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {selectedMoodData?.emoji} {selectedMoodData?.label}
              </Text>
            </View>
          )}

          {/* Triggers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What might have triggered this?
            </Text>
            <Text style={styles.sectionSubtitle}>
              Select all that apply (optional)
            </Text>

            <View style={styles.triggersGrid}>
              {triggers.map((trigger) => (
                <TouchableOpacity
                  key={trigger.value}
                  style={[
                    styles.triggerOption,
                    formData.triggers.includes(trigger.value)
                      ? styles.triggerOptionSelected
                      : null,
                  ]}
                  onPress={() => toggleTrigger(trigger.value)}
                >
                  <Ionicons
                    name={trigger.icon as any}
                    size={20}
                    color={
                      formData.triggers.includes(trigger.value)
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.triggerLabel,
                      formData.triggers.includes(trigger.value)
                        ? styles.triggerLabelSelected
                        : null,
                    ]}
                  >
                    {trigger.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionSubtitle}>
              What's on your mind? (optional)
            </Text>

            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Write about your day, thoughts, or anything you'd like to remember..."
                placeholderTextColor={COLORS.textTertiary}
                value={formData.note}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, note: text }))
                }
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {formData.note.length}/500
              </Text>
            </View>
          </View>

          {/* Voice Note Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Note</Text>
            <Text style={styles.sectionSubtitle}>
              Record your thoughts (coming soon)
            </Text>

            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Voice recording feature will be available soon!"
                )
              }
            >
              <Ionicons
                name="mic-outline"
                size={24}
                color={COLORS.textSecondary}
              />
              <Text style={styles.voiceButtonText}>Tap to record</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
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
  saveButton: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: COLORS.primary + "15",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  moodOption: {
    alignItems: "center",
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    width: "48%",
    ...SHADOWS.sm,
  },
  moodOptionSelected: {
    borderWidth: 3,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  moodLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  moodLabelSelected: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  intensityContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  intensityOption: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  intensityOptionSelected: {
    borderWidth: 2,
  },
  intensityNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  intensityNumberSelected: {
    color: COLORS.textPrimary,
  },
  intensityLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
  },
  intensityLabelSelected: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  triggersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  triggerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  triggerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  triggerLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  triggerLabelSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  noteContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  noteInput: {
    padding: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    minHeight: 120,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: "right",
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderStyle: "dashed",
    backgroundColor: COLORS.gray[50],
    gap: SPACING.sm,
  },
  voiceButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
});
