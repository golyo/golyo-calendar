import React, { useCallback, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@mui/material';
import { useAuth } from '../../hooks/auth';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const Login = () => {
  const schema = useMemo(() => yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
  }), []);

  const { control, handleSubmit, setError, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { login, authUser, signInWithGoogle, signInWithFacebookRedirect } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const doLogin = useCallback((values: FieldValues) => {
    const { email, password } = values;
    login(email, password).then(() => {
      navigate('/');
    }).catch((err: any) => {
      setError('email', {
        type: 'manual',
        message: t(`login.error.${err.code}`)!,
      });
    });
  }, [login, navigate, setError, t]);

  if (authUser) {
    return authUser.emailVerified ? <Navigate to="/" /> : <Navigate to="/verification" />;
  }

  return (
    <form onSubmit={handleSubmit(doLogin)} className="vertical" noValidate>
      <h2>{t('login.login')}</h2>

      <div>
        <Button color="primary" variant="contained" onClick={signInWithGoogle}>
          {t('login.google')}
        </Button>&nbsp;&nbsp;
        <Button color="primary" variant="contained" onClick={signInWithFacebookRedirect}>
          {t('login.facebook')}
        </Button>
        <hr/>
      </div>
      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <TextField
            onChange={onChange}
            value={value}
            label={t('login.email')}
            required
            error={!!errors.email}
            helperText={errors.email?.message as string || ''}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <TextField
            onChange={onChange}
            value={value}
            type="password"
            label={t('login.password')}
            required
            error={!!errors.email}
          />
        )}
      />
      <div>
        <Button color="primary" type="submit" variant="contained">
          {t('login.login')}
        </Button>
      </div>
      <Link to="/register">
        {t('login.registerLink')}
      </Link>
      <Link to="/resetPassword">
        {t('login.resetPassword')}
      </Link>
    </form>
  );
};

export default Login;
