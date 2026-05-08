import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "expo-router";

export default function SalespersonProfile() {
  const { user, companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    status: "",
  });

  const [company, setCompany] = useState({
    name: "",
    ownerName: "",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Load user
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.data() || {};

      setProfile({
        name: userData.name || "",
        email: userData.email || user.email || "",
        phoneNumber: userData.phoneNumber || "",
        role: userData.role || "",
        status: userData.status || "",
      });

      // Load company
      if (companyId) {
        const companySnap = await getDoc(
          doc(db, "companies", companyId)
        );
        const companyData = companySnap.data() || {};

        setCompany({
          name: companyData.name || "",
          ownerName: companyData.ownerName || "",
        });
      }

    } catch (e) {
      console.log(e);
      Alert.alert("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name || "",
        phoneNumber: profile.phoneNumber || "",
      });

      setEditing(false);
      Alert.alert("Success", "Profile updated");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, profile.email);
      Alert.alert(
        "Email Sent",
        "Password reset email sent to your inbox."
      );
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Salesperson Profile</Text>
      </View>

      {/* PROFILE SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Personal Information
        </Text>

        <Label>Name</Label>
        <TextInput
          style={styles.input}
          value={profile.name}
          editable={editing}
          onChangeText={(v) =>
            setProfile({ ...profile, name: v })
          }
        />

        <Label>Email</Label>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.email}
          editable={false}
        />

        <Label>Phone</Label>
        <TextInput
          style={styles.input}
          value={profile.phoneNumber}
          editable={editing}
          onChangeText={(v) =>
            setProfile({ ...profile, phoneNumber: v })
          }
        />

        <Label>Role</Label>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.role}
          editable={false}
        />

        <Label>Status</Label>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={profile.status}
          editable={false}
        />
      </View>

      {/* COMPANY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company</Text>

        <Label>Company Name</Label>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={company.name}
          editable={false}
        />

        <Label>Company Owner</Label>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={company.ownerName}
          editable={false}
        />
      </View>

      {/* ACTION BUTTONS */}
      {!editing ? (
        <Pressable
          style={styles.editBtn}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.editText}>
            Edit Profile
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.saveBtn}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>
            Save Changes
          </Text>
        </Pressable>
      )}

      <Pressable
        style={styles.secondaryBtn}
        onPress={handleResetPassword}
      >
        <Text style={styles.secondaryText}>
          Change Password
        </Text>
      </Pressable>

      <Pressable
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= COMPONENT ================= */
function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 12,
  },

  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  section: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 16,
  },

  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  disabled: {
    backgroundColor: "#f3f4f6",
  },

  editBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
  },

  saveBtn: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  secondaryText: {
    color: "#2563eb",
    fontWeight: "600",
    textAlign: "center",
  },

  logoutBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 12,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
