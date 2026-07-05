import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (name: string, email: string, phone: string, address: string, password: string) => Promise<void>;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateProfileData: (name: string, phone: string, address: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Clean up legacy profile listener if already active
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // 2. Stream user profile in real-time
        unsubscribeProfile = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
            setLoading(false);
          } else {
            console.warn("No user profile exists in Firestore for uid:", currentUser.uid);
            
            // Auto-heal missing profile row: Create a fallback doc directly
            try {
              const nameFromEmail = currentUser.email ? currentUser.email.split('@')[0] : 'সম্মানিত গ্রাহক';
              
              const fallbackProfile: UserProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || nameFromEmail,
                email: currentUser.email || '',
                phone: currentUser.phoneNumber || '',
                address: '',
                createdAt: Date.now(),
                role: 'customer'
              };
              
              await setDoc(userDocRef, fallbackProfile);
              // Successful setDoc triggers onSnapshot again, updating the profile and toggling loading
            } catch (createErr) {
              console.error("Failed to auto-create missing user profile:", createErr);
              setProfile(null);
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Failed to stream user profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  async function signUp(name: string, email: string, phone: string, address: string, password: string) {
    try {
      // 1. Create account with email & password in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Prepare user record following the specified attributes
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        name,
        email,
        phone,
        address,
        createdAt: Date.now(),
        role: 'customer'
      };

      // 3. Write record to Firestore
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfile);
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.CREATE, `users/${firebaseUser.uid}`);
      }
    } catch (err) {
      console.error("SignUp error:", err);
      throw err;
    }
  }

  async function signIn(emailOrPhone: string, password: string) {
    try {
      let emailToUse = emailOrPhone.trim().toLowerCase();

      // If it looks like a phone number, search the users DB to resolve the corresponding email
      if (!emailOrPhone.includes('@')) {
        // We could implement a query, but wait!
        // To log in securely we can query the Firestore `users` collection filtered by phone.
        // Let's do a fetch for the user document that contains phone == emailOrPhone.
        // Wait, can we fetch that? Let's check how we can do this!
        // We can import `collection`, `query`, `where`, `getDocs` from `firebase/firestore`
        const { query, collection, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('phone', '==', emailOrPhone.trim()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const firstDocData = querySnapshot.docs[0].data() as UserProfile;
          emailToUse = firstDocData.email;
        } else {
          throw new Error('এই মোবাইল নম্বরটি দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি!');
        }
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (err) {
      console.error("SignIn error:", err);
      throw err;
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  async function updateProfileData(name: string, phone: string, address: string, photoURL?: string) {
    if (!user) throw new Error("অনুগ্রহ করে আগে লগইন করুন!");
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const updatedData: any = {
        name,
        phone,
        address
      };
      if (photoURL !== undefined) {
        updatedData.photoURL = photoURL;
      }
      await setDoc(userDocRef, updatedData, { merge: true });
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.UPDATE, `users/${user.uid}`);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, logOut, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
