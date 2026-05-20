//app/owner/_layout.js
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";


export default function OwnerLayout(){
    const {loading, role} = useAuth();
    const router = useRouter();

    // if(!loading && role !== 'owner'){
    //     // return <Redirect href="/login" />
    //     router.replace('/login');
    //     return null;
    // }

    useEffect(()=>{
        if(!loading && role !== 'owner'){
            router.replace('/login');
        }
    }, [loading, role]);

    if (loading) return null;
    if (role !== "owner") return null;

    
    return(
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle:{
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 60,
                    paddingBottom: 8,
                },
            }}>
                <Tabs.Screen
                    name='dashboard'
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({color, size}) =>(
                            <Ionicons name="grid-outline" size={size} color={color} />
                        ),
                    }} />

                <Tabs.Screen
                    name="customers"
                    options={{
                        title: 'Customers',
                        tabBarIcon: ({color, size}) =>(
                            <Ionicons name="people-outline" size={size} color={color} />
                        ),
                    }} />

                <Tabs.Screen
                    name="employees"
                    options={{
                        title: 'Employees',
                        tabBarIcon: ({color, size}) =>(
                            <Ionicons name="briefcase-outline" size={size} color={color} />
                        ),
                    }} />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({size, color}) =>(
                            <Ionicons name="person-circle-outline" size={size} color={color} />
                        ),
                    }} />

                <Tabs.Screen
                    name="add-employee"
                    options={{
                        href: null,
                    }} />

                <Tabs.Screen
                    name="customer-details"
                    options={{
                        href: null,
                    }} />

                <Tabs.Screen
                    name="employee-details"
                    options={{
                        href: null,
                    }} />

                <Tabs.Screen
                    name="transactionDetail"
                    options={{
                        href: null,
                    }} />

            </Tabs>
    )
}