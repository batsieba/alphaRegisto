import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { getAuth, updatePassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "expo-router";


export default function AccountantProfile() {
  const { user, companyId } = useAuth();
  const router = useRouter();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || "");
        setPhone(data.phoneNumber || "");
      }

      const companySnap = await getDoc(doc(db, "companies", companyId));
      if (companySnap.exists()) {
        setCompanyName(companySnap.data().name);
      }

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);

      await updateDoc(doc(db, "users", user.uid), {
        name,
        phoneNumber: phone,
      });

      Alert.alert("Success", "Profile updated successfully.");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

   const handleResetPassword = async ()=>{
        try{
            await sendPasswordResetEmail(auth, user.email);
            Alert.alert("Email Sent", 'Password reset email sent to your inbox.')
        }catch(e){
            Alert.alert("Error", e.message);
        }
    };


//   const handleChangePassword = async () => {
//     if (!newPassword || newPassword.length < 6) {
//       return Alert.alert("Error", "Password must be at least 6 characters.");
//     }

//     try {
//       await updatePassword(auth.currentUser, newPassword);
//       setNewPassword("");
//       Alert.alert("Success", "Password changed successfully.");
//     } catch (e) {
//       Alert.alert(
//         "Reauthentication Required",
//         "Please logout and login again before changing password."
//       );
//     }
//   };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/"); // go back to login
  };

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={user?.email || ""}
          editable={false}
          style={[styles.input, { backgroundColor: "#f3f4f6" }]}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />

        <Text style={styles.label}>Role</Text>
        <TextInput
          value="Accountant"
          editable={false}
          style={[styles.input, { backgroundColor: "#f3f4f6" }]}
        />

        <Text style={styles.label}>Company</Text>
        <TextInput
          value={companyName}
          editable={false}
          style={[styles.input, { backgroundColor: "#f3f4f6" }]}
        />

        <Pressable style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Update Profile"}
          </Text>
        </Pressable>
      </View>

      {/* PASSWORD CARD */}
      <View style={styles.card}>
        {/* <Text style={styles.label}>Change Password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Enter new password"
          style={styles.input}
        /> */}

        <Pressable style={styles.updateButton} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </Pressable>


        {/* LOGOUT */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  logo: { width: 110, height: 110, marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },

  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  button: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
});
