import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({});
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
        setName(snap.data().name || "");
        setPhoneNumber(snap.data().phoneNumber || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name, phoneNumber });
      Alert.alert("Success", "Profile updated successfully.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Email Sent", "Check your email to reset your password.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  const initial = (profile.name || profile.email || "A").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name || "Admin"}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#2563eb" />
            <Text style={styles.roleBadgeText}>Platform Administrator</Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputRow, styles.inputRowDisabled]}>
            <Ionicons name="mail-outline" size={16} color="#d1d5db" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ""}
              editable={false}
            />
          </View>

          <Text style={styles.label}>Role</Text>
          <View style={[styles.inputRow, styles.inputRowDisabled]}>
            <Ionicons name="briefcase-outline" size={16} color="#d1d5db" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value="Admin"
              editable={false}
            />
          </View>

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>

          <Pressable style={styles.secondaryBtn} onPress={handleResetPassword}>
            <Ionicons name="key-outline" size={18} color="#2563eb" />
            <Text style={styles.secondaryBtnText}>Change Password</Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  profileName: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 16,
  },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 7 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  inputRowDisabled: { backgroundColor: "#f9fafb" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  inputDisabled: { color: "#9ca3af" },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 48,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    height: 48,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#2563eb" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutBtnText: { fontSize: 15, fontWeight: "600", color: "#dc2626" },
});
