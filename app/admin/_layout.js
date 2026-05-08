//app/admin/_layout.js
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function AdminLayout() {
  const { role, loading } = useAuth();
  const router = useRouter();

//   useEffect(() => {
//     if (loading) return;

//     if (role !== "admin") {
//       router.replace("/");
//     }
//   }, [role, loading]);

    useEffect(()=>{
            if(!loading && role !== 'admin'){
                router.replace('/login');
            }
        }, [loading, role]);

  if (loading) return null;
  if (role !== "admin") return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-company"
        options={{
          title: "Add Company",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="companies"
        options={{
          title: "Active Companies",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person-circle-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
