import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@mui/material';
import { useAuth, AuthState } from '../../hooks/auth';

export const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const RegistrationSuccess = () => {
  const query = useQuery();
  const { authState } = useAuth();
  const { t } = useTranslation();

  const action = query.get('action');

  return (
    <div className="vertical">
      <h2>{t('login.' + action)}</h2>
      <div>
        <div>{t('login.' + action + 'Success')}</div>
      </div>
      {authState === AuthState.VERIFIED && <Link to="/">
        <Button color="primary" variant="contained">
          {t('login.startWork')}
        </Button>
      </Link>}
      <div>
        <Button color="primary" variant="contained">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default RegistrationSuccess;