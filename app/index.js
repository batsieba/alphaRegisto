//app/index.js

import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // console.log("ROLE:", role);


  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if(!role) {
        // router.replace('/login');
        return;
    }

    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if(role === 'owner'){
        router.replace('/owner/dashboard')
    }
    else if(role === 'customer'){
        router.replace('/customer/dashboard')
    }

    else if(role === 'manager'){
        router.replace('/manager/dashboard')
    }
    else if (role === "salesperson") {
      router.replace("/salesperson/dashboard");
    }
    else if (role === "accountant") {
      router.replace("/accountant/dashboard");
    }

    
  }, [loading, user, role]);

  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
  

  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
