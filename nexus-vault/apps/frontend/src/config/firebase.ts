import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = (() => {
  const p = new GoogleAuthProvider();
  p.addScope('email');
  p.addScope('profile');
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
})();

export const microsoftProvider = (() => {
  const p = new OAuthProvider('microsoft.com');
  p.addScope('openid');
  p.addScope('profile');
  p.addScope('email');
  p.setCustomParameters({ prompt: 'select_account', tenant: 'common' });
  return p;
})();
