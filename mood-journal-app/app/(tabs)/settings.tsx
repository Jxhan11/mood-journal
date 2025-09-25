import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
} from "../../theme/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useStore();

  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [dataSync, setDataSync] = React.useState(true);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/screens/welcome");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert(
              "Feature Coming Soon",
              "Account deletion will be available soon."
            );
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          id: "profile",
          title: "Profile Settings",
          subtitle: "Update your personal information",
          icon: "person-outline",
          onPress: () => router.push("/settings/profile"),
          showArrow: true,
        },
        {
          id: "privacy",
          title: "Privacy & Security",
          subtitle: "Manage your privacy settings",
          icon: "shield-outline",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Privacy settings will be available soon."
            ),
          showArrow: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Daily mood tracking reminders",
          icon: "notifications-outline",
          showSwitch: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "dark-mode",
          title: "Dark Mode",
          subtitle: "Use dark theme",
          icon: "moon-outline",
          showSwitch: true,
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: "data-sync",
          title: "Data Sync",
          subtitle: "Sync data across devices",
          icon: "sync-outline",
          showSwitch: true,
          value: dataSync,
          onToggle: setDataSync,
        },
      ],
    },
    {
      title: "Data & Backup",
      items: [
        {
          id: "export",
          title: "Export Data",
          subtitle: "Download your mood data",
          icon: "download-outline",
          onPress: () =>
            Alert.alert("Coming Soon", "Data export will be available soon."),
          showArrow: true,
        },
        {
          id: "backup",
          title: "Backup Settings",
          subtitle: "Manage your data backups",
          icon: "cloud-outline",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Backup settings will be available soon."
            ),
          showArrow: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help & FAQ",
          subtitle: "Get help and find answers",
          icon: "help-circle-outline",
          onPress: () =>
            Alert.alert("Coming Soon", "Help section will be available soon."),
          showArrow: true,
        },
        {
          id: "feedback",
          title: "Send Feedback",
          subtitle: "Share your thoughts with us",
          icon: "chatbubble-outline",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Feedback feature will be available soon."
            ),
          showArrow: true,
        },
        {
          id: "about",
          title: "About",
          subtitle: "App version and info",
          icon: "information-circle-outline",
          onPress: () =>
            Alert.alert(
              "Mood Journal",
              "Version 1.0.0\n\nA simple and beautiful mood tracking app to help you understand your emotional patterns and improve your wellbeing."
            ),
          showArrow: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.showSwitch}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>

      <View style={styles.settingRight}>
        {item.showSwitch ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: COLORS.gray[300],
              true: COLORS.primary + "50",
            }}
            thumbColor={item.value ? COLORS.primary : COLORS.white}
          />
        ) : item.showArrow ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textTertiary}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.first_name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push("/settings/profile")}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.dangerIcon]}>
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>
                    Sign Out
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.dangerIcon]}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>
                    Delete Account
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    Permanently delete your account
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Mood Journal v1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.base,
  },
  profileAvatarText: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: "bold",
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  editProfileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.lg,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.base,
  },
  dangerIcon: {
    backgroundColor: COLORS.error + "15",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dangerText: {
    color: COLORS.error,
  },
  settingSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  settingRight: {
    marginLeft: SPACING.base,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
  },
});
