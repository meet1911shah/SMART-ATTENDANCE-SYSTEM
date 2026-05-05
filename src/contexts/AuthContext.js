import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user data from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUser({ ...firebaseUser, ...docSnap.data() });
          } else {
            // Fallback if firestore doc doesn't exist yet
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to fetch user profile");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (identifier, password, role) => {
    try {
      setLoading(true);
      const trimmedIdentifier = identifier.trim();
      let email = trimmedIdentifier;

      // Check if identifier is an email. If not, treat as username and find email.
      const isEmail = trimmedIdentifier.includes('@');

      if (!isEmail) {
        const username = trimmedIdentifier.toLowerCase();
        console.log(`Attempting to find email for username: ${username}`);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username), where('role', '==', role));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error(`User "${identifier}" not found with role "${role}"`);
        }

        // Use the first match
        email = querySnapshot.docs[0].data().email;
        console.log(`Found email: ${email}`);
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Verify role matches
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role !== role) {
          await signOut(auth); // Log out if role mismatch
          throw new Error(`Invalid role. This account is registered as a ${userData.role}, not an ${role}. Please select the correct role above.`);
        }
        setUser({ ...firebaseUser, ...userData });
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: { ...firebaseUser, ...userData } };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error("Login error:", error);
      let message = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid username/email or password";
      }
      toast.error(message || 'Login failed');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // Create firestore document
      const userProfile = {
        uid: firebaseUser.uid,
        name: userData.name,
        username: userData.username.toLowerCase(),
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

      setUser({ ...firebaseUser, ...userProfile });
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.message || 'Signup failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      if (!auth.currentUser) throw new Error("No user logged in");

      const uid = auth.currentUser.uid;
      const docRef = doc(db, 'users', uid);

      await updateDoc(docRef, updates);

      // Update local state
      setUser(prev => ({ ...prev, ...updates }));

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error("Update error:", error);
      toast.error('Failed to update profile');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const forgotPassword = async (email, role) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (role, email, newPassword) => {
    // Firebase handles password reset via email link.
    // This function might need to be adapted if the UI expects an immediate reset.
    // For now, we'll advise the user to use the email link.
    toast.dismiss();
    toast.success("Please check your email to reset your password.");
    return { success: true };
  };

  const forceBootstrapAdmin = async () => {
    try {
      setLoading(true);
      const adminEmail = 'admin@system.com';
      const adminPassword = '123456';

      let firebaseUser;
      try {
        // 1. Try to create the user
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        firebaseUser = userCredential.user;
        console.log("Admin auth account created");
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          // 2. If already exists, just sign in to get the UID
          const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          firebaseUser = userCredential.user;
          console.log("Admin auth account already exists, signed in");
        } else {
          throw authError;
        }
      }

      // 3. GUARANTEED PROFILE SYNC: Write the firestore document regardless of whether user was new
      const adminProfile = {
        uid: firebaseUser.uid,
        name: 'System Administrator',
        username: 'admin',
        email: adminEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        isSystemAdmin: true
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), adminProfile);
      console.log("Admin Firestore profile force-synced");

      setUser({ ...firebaseUser, ...adminProfile });
      toast.success('Admin account successfully rescued!');
      return { success: true };
    } catch (error) {
      console.error("Rescue error:", error);
      toast.error(`Admin rescue failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    signup,
    forceBootstrapAdmin,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

