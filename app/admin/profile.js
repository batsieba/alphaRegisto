import { View, Text, StyleSheet, Image, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
        setName(snap.data().name || "");
        setPhoneNumber(snap.data().phoneNumber || "");
        setRole(snap.data().role || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        phoneNumber,
        
      });
      Alert.alert("Success", "Profile updated");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Email Sent", "Check your email to reset password");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Loading...</Text>;
  }

 return (
  <ScrollView style={styles.container}>

    {/* HEADER */}
    <View style={styles.header}>
      <Image
        source={require("../../assets/logo.png")}
        resizeMode="contain"
        style={styles.logo}
      />
      <Text style={styles.title}>Admin Profile</Text>
    </View>

    {/* PROFILE CARD */}
    {/* <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {profile.name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.profileName}>{profile.name}</Text>
      <Text style={styles.profileMeta}>{profile.role?.toUpperCase()}</Text>
    </View> */}

    {/* ACCOUNT INFO */}
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Account Information</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.disabled]}
        value={user?.email || ""}
        editable={false}
      />

      <Text style={styles.label}>Role</Text>
      <TextInput
        style={[styles.input, styles.disabled]}
        value={profile.role}
        editable={false}
      />

      <Pressable style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save Changes</Text>
      </Pressable>
    </View>

    {/* SECURITY */}
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Security</Text>

      <Pressable style={styles.secondaryButton} onPress={handleResetPassword}>
        <Text style={styles.secondaryText}>Change Password</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>

  </ScrollView>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#f3f4f6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 90,
    height: 90,
    marginRight: 12,
    borderRadius: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },

  profileName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },

  profileMeta: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111827",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  disabled: {
    backgroundColor: "#f3f4f6",
  },

  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});
