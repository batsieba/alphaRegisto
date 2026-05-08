//app/customer/_layout.js
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";


export default function CustomerLayout(){
    const {loading ,  role} = useAuth();
    const router = useRouter();

    useEffect(()=>{
        if(!loading && role !== 'customer'){
            router.replace('/login');
        }
    }, [loading, role]);

    if(loading) return null;
    if(role !== 'customer') return null;
    return(
        <Tabs screenOptions={{headerShown: false}}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({color, size}) =>(
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }} />

            
            <Tabs.Screen
                name="companies"
                options={{
                    title: 'Companies',
                    tabBarIcon: ({color, size}) =>(
                        <Ionicons name="business" size={size} color={color} />
                    ),
                }} />

            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Transactions',
                    tabBarIcon: ({color, size}) =>(
                        <Ionicons name="swap-horizontal" size={size} color={color} />
                    ),
                }} />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({color, size}) =>(
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }} />

            <Tabs.Screen
                    name="transactionDetail"
                    options={{
                        href: null,
                    }} />
        </Tabs>
    )
}