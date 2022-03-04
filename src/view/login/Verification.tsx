import React, { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthState, useAuth } from '../../hooks/auth';

const Verification = () => {
  const { t } = useTranslation();
  const { sendVerifyEmail, logout, authState, authUser } = useAuth();
  const { email } = authUser || {};

  const sendVerification = useCallback(() => {
    if (authUser && !authUser.emailVerified) {
      sendVerifyEmail();
    } else {
      // TODO REDIRECT
    }
  }, [sendVerifyEmail, authUser]);

  if (authState === AuthState.UNAUTHORIZED) {
    return <Navigate to="/login"></Navigate>;
  }
  if (authUser && authUser.emailVerified) {
    return <Navigate to="/"></Navigate>;
  }
  if (authState === AuthState.INIT) {
    return <div>...</div>;
  }

  return (
    <div className="vertical">
      <h2>{t('login.verification')}</h2>
      {authState === AuthState.AUTHORIZED &&
        <div>
          <div>{t('login.verificationSent', { email })}</div>
          <div>{t('login.verificationTodo')}</div>
        </div>}
      {authState === AuthState.VERIFIED &&
        <div>
          <p>{t('login.verificationSent', { email })}</p>
          <p>{t('login.verificationTodo')}</p>
        </div>}
      <Button color="primary" type="submit" variant="contained" onClick={logout}>
        {t('login.otherUser')}
      </Button>
      <Button color="primary" type="submit" variant="contained" onClick={sendVerification}>
        {t('login.sendAgain')}
      </Button>
    </div>
  );
};

export default Verification;