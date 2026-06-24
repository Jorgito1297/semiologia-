import * as admin from 'firebase-admin';

/**
 * FirebaseAdminProvider — initializes the Firebase Admin SDK.
 *
 * Credentials are read exclusively from environment variables.
 * The private key uses `replace(/\\n/g, '\n')` because .env files
 * encode newlines as literal `\n` strings, but the PEM format
 * requires actual newline characters.
 *
 * This provider is registered with the token 'FIREBASE_ADMIN' and
 * can be injected anywhere via @Inject('FIREBASE_ADMIN').
 */
export const FirebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: (): admin.app.App => {
    // Prevent duplicate app initialization (e.g. during hot reload in dev)
    if (admin.apps.length > 0) {
      return admin.apps[0] as admin.app.App;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase Admin credentials. ' +
        'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and ' +
        'FIREBASE_PRIVATE_KEY are set in the environment.',
      );
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  },
};
