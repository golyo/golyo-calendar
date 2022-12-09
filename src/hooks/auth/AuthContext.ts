import { createContext } from 'react';
import { User as AuthUser, UserCredential } from 'firebase/auth';

export enum AuthState {
  INIT = 'INIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  AUTHORIZED = 'AUTHORIZED',
  VERIFIED = 'VERIFIED',
}

export interface AuthContextType {
  authUser?: AuthUser;
  authState: AuthState;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  sendVerifyEmail: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  updateUser: (displayName: string, photoURL?: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  startPasswordReset: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signInWithFacebookRedirect: () => Promise<never>;
  isPasswordEnabled: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export default AuthContext;