import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function ManagerLayout(){
    const {loading, role} = useAuth();
    const router = useRouter();

    useEffect(()=>{
        if(!loading && role !== 'manager'){
            router.replace('/login');
        }
    }, [loading,role]);

    if(loading) return null;
    if(role !== 'manager') return null;

    return(
        <Tabs screenOptions={{headerShown: false}}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon:({color, size})=>(
                        <Ionicons name='speedometer' size={size} color={color} />
                    ),
                }} />

            <Tabs.Screen
                name="employees"
                options={{
                    title: 'Employees',
                    tabBarIcon:({size,color}) =>(
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }} />

             <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Transactions',
                    tabBarIcon:({size,color}) =>(
                        <Ionicons name="swap-horizontal" size={size} color={color} />

                    ),
                }} />
            
            <Tabs.Screen
                name="customers"
                options={{
                    title:'Customers',
                    tabBarIcon:({size,color}) =>(
                        <Ionicons name="person-circle" size={size} color={color} />
                    ),
                }} />

            <Tabs.Screen
                name="profile"
                options={{
                    title:'Profile',
                    tabBarIcon: ({size,color}) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }} /> 

            <Tabs.Screen
                    name="employee/[id]"
                    options={{
                        href: null,
                    }} />

            <Tabs.Screen
                    name="add-transaction"
                    options={{
                        href: null,
                    }} />

            
            <Tabs.Screen
                    name="customerDetail"
                    options={{
                        href: null,
                    }} />


            <Tabs.Screen
                    name="transactionDetail"
                    options={{
                        href: null,
                    }} />

            <Tabs.Screen
                    name="editTransaction"
                    options={{
                        href: null,
                    }} />
        </Tabs>
    )



}