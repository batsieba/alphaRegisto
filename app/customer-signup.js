//app/customer-signup.js
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { secondaryAuth } from "../config/secondaryAuth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

async function generateCompanyId(){
    const snapshot = await getDocs(collection(db, 'companies'));
    const count = snapshot.size +1;
    return `COM-${String(count).padStart(4,"0")}`;
}

export default function CustomerSignUp(){
    const router = useRouter();

    const [name, setName] = useState('');
    const [email,setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');

    const [hasCompany, setHasCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSignup = async () =>{
        if(!name || !email || !phoneNumber || !password){
            Alert.alert("Error", "All fields are required");
            return;
        }

        if (hasCompany && !companyName){
            Alert.alert("Error", 'Company name is required');
            return;
        }

        setLoading(true);

        try{

            //create auth user using the secondary
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email.toLowerCase(), password);
            const uid = cred.user.uid;
            let companyId = null;

            await signInWithEmailAndPassword(auth, email.toLowerCase(), password);

            //creat company if customer has company associated with it
            if(hasCompany){
                companyId = await generateCompanyId();

                await setDoc(doc(db,'companies', companyId),{
                    companyId,
                    name: companyName,
                    ownerId: uid,
                    ownerName: name,
                    email,
                    phoneNumber,
                    status: 'active',
                    createdAt: serverTimestamp(),
                });
            }

            //create cust user doc
            await setDoc(doc(db, 'users', uid), {
                uid,
                name,
                email,
                phoneNumber,
                role: hasCompany ? 'owner': 'customer', 
                roles: hasCompany ? ['customer', 'owner'] : ['customer'],
                primaryRole: 'customer',
                companyId: companyId || null,
                companyName: hasCompany ? companyName : null,
                status: 'active',
                createdAt: serverTimestamp(),
            });

            //clean up 
            await auth.signOut();
            await secondaryAuth.signOut();

            Alert.alert("Success", 'Account created successfully');

            router.replace('/login');

        }catch(e){
            Alert.alert("Error", e.message);
        }finally{
            setLoading(false);
        }

    };


    return(
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios'? "padding": undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>

                <View style={styles.header}>
                <Image
                    source={require('../assets/logo.png')}
                    resizeMode="contain"
                    style={styles.logo} />

                <Text style={styles.title}>Customer Signup</Text>

                </View>
                <Text style={styles.subtitle}> Create your account</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber}  keyboardType="phone-pad"/>

                
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} />

                {/* COMPANY TOGGLE */}
                <Text style={styles.label}>Do you have a company?</Text>
                <View style={styles.toggleRow}>
                    {["No", "Yes"].map((opt)=>(
                        <Pressable 
                            key={opt}
                            style={[
                                styles.toggleBtn,
                                hasCompany === (opt === 'Yes') && styles.activeToggle,
                            ]}
                            onPress={()=> setHasCompany(opt === 'Yes')}>
                                <Text style={styles.toggleText}>{opt}</Text>
                            </Pressable>
                    ))}
                </View>

                {hasCompany && (
                    // <Text style={styles.label}>Company Name</Text>
                    <TextInput
                        placeholder="Company Name"
                        style={styles.input}
                        value={companyName}
                        onChangeText={setCompanyName}
                        />
                )}

                <Pressable 
                    style={styles.button}
                    onPress={handleSignup}
                    disabled={loading}>
                        <Text style={styles.buttonText}>
                            {loading ? 'Creating account ...' : 'Sign Up'}
                        </Text>
                    </Pressable>

                <Pressable onPress={() => router.replace('/login')}>
                    <Text style={styles.back}>Already have an account? Login</Text>
                </Pressable>

                
            </ScrollView>

        </KeyboardAvoidingView>
    )

}

const styles = StyleSheet.create({
    container:{
        backgroundColor: '#fff',
        flex: 1,
        padding: 20,
    },
    header:{
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    logo:{
        width: 110,
        height: 110,
        marginRight: 12,
    },
    title:{
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        color: "#111827",
    },
    subtitle:{
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 24,
    },
    label:{
        fontWeight: '600',
        marginBottom: 8,
    },
    input:{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 14, 
    },
    toggleRow:{
        flexDirection: 'row',
        marginBottom: 14,
    },
    toggleBtn:{
        flex:1,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
        alignItems: 'center',
    },
    activeToggle: {
        backgroundColor: '#2563eb',
    },
    toggleText:{
        color:'#111827',
        fontWeight: '600',
    },
    button:{
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    buttonText:{
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