import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { User } from '../types/models';

export interface AuthError {
  code: string;
  message: string;
}

class AuthService {
  private mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date()
    };
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const { auth, firestore } = getFirebaseServices();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName });

      const userDoc = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        photoURL: null,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(firestore, 'users', firebaseUser.uid), userDoc);

      return this.mapFirebaseUser(firebaseUser);
    } catch (error: any) {
      console.error('Sign up error:', error);

      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw new Error('Failed to create account');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { auth } = getFirebaseServices();

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Sign in error:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Account has been disabled');
      }

      throw new Error('Failed to sign in');
    }
  }

  async signOut(): Promise<void> {
    try {
      const { auth } = getFirebaseServices();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { auth } = getFirebaseServices();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);

      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw new Error('Failed to send password reset email');
    }
  }

  getCurrentUser(): User | null {
    const { auth } = getFirebaseServices();
    const firebaseUser = auth.currentUser;

    return firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const { auth } = getFirebaseServices();

    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(this.mapFirebaseUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();