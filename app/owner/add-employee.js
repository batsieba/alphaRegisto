import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../../config/firebase";
import { secondaryAuth } from "../../config/secondaryAuth";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";


function generateTempPassword(){
    return Math.random().toString(36).slice(-10);
}

export default function AddEmployee(){
    const {companyName, companyId} = useAuth();

    const [name, setName] = useState("");
    const [email,setEmail]= useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('salesperson');
    const [loading , setLoading] = useState(false);


    const handleCreateEmployee = async ()=>{
        if(!name || !email || !phoneNumber){
            Alert.alert("Error", "All fields must be filled");
            return;
        }

        setLoading(true);

        try{
            const tempPassword = generateTempPassword();

            //create auth using secondary auth
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);

            const uid = cred.user.uid;

            //create firestore user doc
            await setDoc(doc(db,'users', uid),{
                uid,
                name,
                email,
                role,
                phoneNumber,
                companyId,
                companyName,
                status: 'active',
                mustResetPassword: true,
                createdAt: serverTimestamp(),
            });

            // send reset password email
            await sendPasswordResetEmail(secondaryAuth, email,{
                url: 'https://alpharegisto-c4f6e.web.app/login',
                handleCodeInApp: false,
            });

            //cleanup secondary auth session
            await secondaryAuth.signOut();

            Alert.alert("Success", "Employee created. Password reset email sent.");

            setName('');
            setEmail('');
            setPhoneNumber('');
            setRole('salesperson');
        }catch(e){
            Alert.alert("Error",e.message);
        }finally{
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logo} />
                <Text style={styles.title}>Add Employee</Text>
            </View>

            {/* FORM */}
            <Text style={styles.label}>Company</Text>
            <Text style={[styles.readonly]}>{companyName}</Text>

            <Text style={styles.label}>Employee Name</Text>
            <TextInput 
                placeholder="Employee Name"
                style={styles.input}
                value={name}
                onChangeText={setName} />

            <Text style={styles.label}>Email Address</Text>
            <TextInput 
                placeholder="Email Address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none" />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
                placeholder="Phone Number"
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber} />

            {/* ROLE SELECTOR */}
            <Text style={styles.label}>Role</Text>
            <View style={styles.roles}>
                {["manager", 'salesperson', 'accountant'].map((r) =>(
                    <Pressable
                        key={r}
                        style={[styles.roleBtn, role === r && styles.activeRole]}
                        onPress={()=> setRole(r)}>
                            <Text>{r}</Text>
                        </Pressable>
                ))}
            </View>

            <Pressable style={styles.button} onPress={handleCreateEmployee} disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Creating' : 'Create Employee'}
                </Text>
            </Pressable>

        </View>
    );
}

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo:{
        width:110,
        height: 110,
        marginRight: 12,
    },
    title:{
        fontSize: 22,
        fontWeight: '700',
    },
    label:{
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
        marginTop: 14,
    },
    input:{
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827'
    },
    readonly:{
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        borderRadius: 12,
        fontSize: 15,
    },
    roles:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    roleBtn:{
        flex: 1,
        paddingVertical: 12,
        marginRight: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    activeRole:{
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    button:{
        marginTop: 30,
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText:{
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }

});