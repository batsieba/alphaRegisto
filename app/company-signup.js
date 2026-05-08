import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { db } from "../config/firebase";

export default function CompanySignup(){
    const router = useRouter();

    const [companyName, setCompanyName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    // const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async () =>{
        if (!companyName || !ownerName || !phoneNumber || !email ){
            Alert.alert("Missing fields", "Please fill all required fields");
            return;
        }

        try{
            setLoading(true);

            await addDoc(collection(db, 'company_requests'),{
                companyName,
                ownerName,
                email: email.toLowerCase(),
                phoneNumber,
                // password,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            Alert.alert("Request Sent", "Your company request has been submitted and is awaiting approval.");

            router.replace("/login");

        }catch(e){
            Alert.alert("Error", e.message);
        }finally{
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={{flex:1}}
            behavior={Platform.OS === "ios" ? "padding": undefined} >

            <ScrollView contentContainerStyle={styles.container}>

            <Image 
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain" />

            <Text style={styles.title}>Register Your Company</Text>
            <Text style={styles.subtitle}>Submit your company details for approval</Text>

            <TextInput
                placeholder="Company Name"
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName} />

            <TextInput
                placeholder="Owner Name"
                style={styles.input}
                value={ownerName}
                onChangeText={setOwnerName} />
            
            <TextInput
                placeholder="Email Address"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail} />


            <TextInput
                placeholder="Phone Number"
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber} />
            
            {/* <TextInput
                placeholder="Password"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword} /> */}

            <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>
                    {loading ? "Submitting...": "Submit Request"}
                </Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.back}>← Back to Login</Text>
            </Pressable>


            </ScrollView>


            </KeyboardAvoidingView>
    )

}


const styles = StyleSheet.create({
    container:{
        flex:1,
        
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    logo:{
        width: 120,
        height: 120,
        alignSelf: "center",
    },
    title:{
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 6,
        color: "#111827"
    },
    subtitle: {
        textAlign: "center",
        color: '#6b7280',
        marginBottom: 28,
    },
    input:{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius:12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 14,
    },
    button:{
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    back:{
        textAlign: 'center',
        marginTop: 18,
        color: '#2563eb',
        fontSize: 15,
    }
});