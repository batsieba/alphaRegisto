import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDocs, serverTimestamp, setDoc , collection} from "firebase/firestore";
import { useState } from "react";
import { Image, StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { db } from "../../config/firebase";
import { secondaryAuth } from "../../config/secondaryAuth";

// GENERATE TEMPORARY PASSWORD
function generateTempPassword(){
    return Math.random().toString(36).slice(-10);
}


//GENERATE COMPANY ID
async function generateCompanyId(){
    const snapshot = await getDocs(collection(db, 'companies'));
    const count = snapshot.size + 1;
    return `COM-${String(count).padStart(4,"0")}`;
}


export default function AddCompany(){
    const router = useRouter();

    const [companyName, setCompanyName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);


    const handleCreateCompany = async ()=>{
        if(!companyName || !ownerName || !email || !phoneNumber){
            Alert.alert("Error", "All fields are required.");
            return;
        }

        setLoading(true);

        try{
            const companyId = await generateCompanyId();
            const tempPassword = generateTempPassword();

            //CREATE AUTH USER
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);

            const uid = cred.user.uid;

             // 2️⃣ Sign BACK IN as ADMIN (CRITICAL)
            // await signInWithEmailAndPassword(auth, "admin@gmail.com", "123456");


            //CREATE COMPANY DOCUMENT
            await setDoc(doc(db, "companies", companyId),{
                companyId,
                name: companyName,
                ownerUid: uid,
                ownerName,
                email,
                phoneNumber,
                status: 'active',
                createdAt: serverTimestamp(),
            });


            //CREATE USER DOCUMENT
            await setDoc(doc(db, 'users', uid),{
                uid,
                role: 'owner',
                companyId,
                companyName,
                name: ownerName,
                email,
                phoneNumber,
                mustResetPassword: true,
                createdAt: serverTimestamp(),
            });


            //FORCE PASSWORD RESET
            await sendPasswordResetEmail(secondaryAuth, email, {
            url: 'https://alpharegisto-c4f6e.web.app/login',
            handleCodeInApp: false,
        });


        //clean up secondary session
        await secondaryAuth.signOut();

            Alert.alert("Success", "Company created. Password reset email sent.");

            router.replace('/admin/companies');
            
        }catch(e){
            Alert.alert("Error", e.message);
        }finally{
            setLoading(false);
        }
    }


    return(
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
            <Image 
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"/>
            <Text style={styles.title}>Add New Company</Text>
            </View>

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
                value={email}
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
                />

            <TextInput
                placeholder="Phone Number"
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad" />

            <Pressable 
                style={styles.button}
                onPress={handleCreateCompany}
                disabled={loading}>

                <Text style={styles.buttonText}>
                    {loading ? "Creating Company...": "Create Company"}
                </Text>

            </Pressable>



        </ScrollView>
    )


    
}

const styles = StyleSheet.create({

    container:{
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        
    },
    header:{
        flexDirection:"row",
        alignItems: 'center',
        marginBottom: 16,
        
    },
    content:{
        
    },
    logo:{
        width: 110,
        height: 110,
        marginRight: 12
    },
    title:{
        fontSize: 22,
        fontWeight: '700',
        
        textAlign: 'center'
    },
    input:{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    button:{
        backgroundColor: "#2563eb",
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    buttonText:{
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',

    }
});