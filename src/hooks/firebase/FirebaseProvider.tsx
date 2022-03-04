import React, { useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

import FirebaseContext, { FirebaseServices } from './FirebaseContext';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APPID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};


const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<FirebaseServices>({} as FirebaseServices);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);

    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    setServices({
      auth,
      analytics,
      firestore,
    });
  }, []);

  const ctx = useMemo(() => (
    services
  ), [services]);

  return services.auth ? <FirebaseContext.Provider value={ctx}>{children}</FirebaseContext.Provider> : null;
};

const useFirebase = () => useContext<FirebaseServices>(FirebaseContext);

export { useFirebase };

export default FirebaseProvider;