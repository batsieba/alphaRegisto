import { useState, useEffect } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth, db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail, signOut } from "firebase/auth";

export default function OwnerProfile() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    companyName: "",
    roles: [],
    role: "",
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
      });

      Alert.alert("Success", "Profile updated successfully.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, profile.email);
      Alert.alert("Email Sent", "Password reset email sent.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const switchToCustomer = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "customer",
      });

      await signOut(auth);

      router.replace("/customer/dashboard");
    } catch (err) {
      Alert.alert("Error", "Failed to switch role");
    }
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.title}>Account Profile</Text>
      </View>

      {/* AVATAR */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.userName}>{profile.name}</Text>
        <Text style={styles.userEmail}>{profile.email}</Text>
      </View>

      {/* PROFILE INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(v) => setProfile({ ...profile, name: v })}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={profile.phoneNumber}
          onChangeText={(v) => setProfile({ ...profile, phoneNumber: v })}
        />

        <Text style={styles.label}>Company</Text>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.companyName}
          editable={false}
        />

        <Text style={styles.label}>Primary Role</Text>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.role}
          editable={false}
        />

        <Text style={styles.label}>All Roles</Text>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.roles?.join(", ") || "—"}
          editable={false}
        />
      </View>

      {/* ROLE SWITCH */}
      {profile.roles?.includes("customer") && profile.role === "owner" && (
        <Pressable style={styles.switchBtn} onPress={switchToCustomer}>
          <Text style={styles.switchText}>Switch to Customer View</Text>
        </Pressable>
      )}

      {/* ACTION BUTTONS */}
      <View style={styles.actionsCard}>
        <Pressable style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryText}>Save Changes</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={handleResetPassword}>
          <Text style={styles.secondaryText}>Change Password</Text>
        </Pressable>
      </View>

      {/* LOGOUT */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  content: {
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },

  logo: {
    width: 70,
    height: 70,
    marginRight: 10,
    borderRadius: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },

  userName: {
    fontSize: 18,
    fontWeight: "700",
  },

  userEmail: {
    color: "#6b7280",
    marginTop: 3,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },

  disabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },

  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },

  primaryBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  primaryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
  },

  secondaryText: {
    color: "#2563eb",
    textAlign: "center",
    fontWeight: "700",
  },

  logoutBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 12,
    marginBottom: 30,
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  switchBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  switchText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});