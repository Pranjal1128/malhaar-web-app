import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client instance
// Since the dev server / build might already have initialized, we check if there are apps or initialize
const firebaseConfigWithProxy = {
  ...firebaseConfig,
  authDomain: typeof window !== 'undefined' ? window.location.host : firebaseConfig.authDomain
};
const app = initializeApp(firebaseConfigWithProxy);
export const auth = getAuth(app);

// Provider setup with the precise Google Workspace scopes requested
export const provider = new GoogleAuthProvider();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

SCOPES.forEach(scope => {
  provider.addScope(scope);
});

let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

export const connectGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    const width = 600;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popupUrl = `${window.location.origin}/oauth-popup`;
    const popup = window.open(
      popupUrl,
      'google_workspace_oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'));
      return;
    }

    const messageListener = (event: MessageEvent) => {
      // Validate origin matches current window origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'FIREBASE_AUTH_SUCCESS') {
        const { user, accessToken } = event.data;
        cachedAccessToken = accessToken;
        cachedGoogleUser = user;

        sessionStorage.setItem('google_workspace_token', accessToken);
        sessionStorage.setItem('google_workspace_user', JSON.stringify(user));

        cleanup();
        resolve({ user, accessToken });
      } else if (event.data?.type === 'FIREBASE_AUTH_FAILURE') {
        cleanup();
        reject(new Error(event.data.error || 'Failed to authenticate with Google Workspace.'));
      }
    };

    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        // Resolve with null instead of rejecting when the user closes the popup.
        resolve(null);
      }
    }, 1000);

    const cleanup = () => {
      window.removeEventListener('message', messageListener);
      clearInterval(checkClosedInterval);
    };

    window.addEventListener('message', messageListener);
  });
};

export const getWorkspaceToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem('google_workspace_token');
  }
  return cachedAccessToken;
};

export const getWorkspaceUser = (): any => {
  if (!cachedGoogleUser) {
    const stored = localStorage.getItem('google_workspace_user');
    if (stored) {
      try {
        cachedGoogleUser = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
  }
  return cachedGoogleUser;
};

export const disconnectGoogleWorkspace = () => {
  cachedAccessToken = null;
  cachedGoogleUser = null;
  localStorage.removeItem('google_workspace_token');
  localStorage.removeItem('google_workspace_user');
};
