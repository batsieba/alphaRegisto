//app/login.js
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../config/firebase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);

      // Navigation handled after login (admin / owner logic later)
      router.replace("/");
    } catch (e) {
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

        {/* CUSTOMER BUTTON */}
        <Pressable style={styles.customerBtn}
            onPress={()=> router.push('/customer-signup')}>
                <Text style={styles.customerText}>Customer?</Text>
            </Pressable>


      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome */}
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        Sign in to continue to Alpha Registo
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email address"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Login button */}
      <Pressable style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </Pressable>

      {/* Register company */}
      <Pressable onPress={() => router.push("/company-signup")}>
        <Text style={styles.register}>
          Don’t have a company account?{" "}
          <Text style={styles.registerLink}>Register your company</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  customerBtn:{
    position:"absolute",
    top: 70,
    right: 20,
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: 0.2,
    shadowOpacity: 1,
  },
  customerText:{
    color: '#fff',
    fontSize: 14,
    fontWeight: '600', 
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },

  register: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
  },
  registerLink: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
