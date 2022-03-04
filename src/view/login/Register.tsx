import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@mui/material';
import { AuthState, useAuth } from '../../hooks/auth';
import BackButton from '../common/BackButton';

const Register = () => {
  const { handleSubmit, control, setError, formState: { errors } } = useForm();
  const { t } = useTranslation();
  const { register, authState } = useAuth();

  const doRegister = useCallback((values) => {
    const { email, password, passwordCheck, displayName } = values;
    if (password !== passwordCheck) {
      setError('passwordCheck', {
        type: 'manual',
        message: t('login.error.passwordCheck'),
      });
      return;
    }
    register(email, password, displayName).then(() => {
      // setErrors({});
    }).catch((err: any) => {
      if (err.code.endsWith('password')) {
        setError('password', {
          type: 'manual',
          message: t('login.error.' + err.code),
        });
      } else {
        setError('email', {
          type: 'manual',
          message: t('login.error.' + err.code),
        });
      }
    });
  }, [register, setError, t]);

  if (authState === AuthState.AUTHORIZED) {
    return <Navigate to="/verification"></Navigate>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(doRegister)} className="vertical">
        <h2>{t('login.registration')}</h2>
        <Controller
                    name={'displayName'}
                    control={control}
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                      <TextField
                            onChange={onChange}
                            value={value}
                            label={t('login.userName')}
                            required
                        />
                    )}
                />
        <Controller
                    name={'email'}
                    control={control}
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                      <TextField
                            onChange={onChange}
                            value={value}
                            label={t('login.email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            required
                        />
                    )}
                />
        <Controller
                    name={'password'}
                    control={control}
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                      <TextField
                            onChange={onChange}
                            value={value}
                            type='password'
                            label={t('login.password')}
                            required
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                    )}
                />
        <Controller
                    name={'passwordCheck'}
                    control={control}
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                      <TextField
                            onChange={onChange}
                            value={value}
                            type='password'
                            label={t('login.passwordCheck')}
                            required
                            error={!!errors.passwordCheck}
                            helperText={errors.passwordCheck?.message}
                        />
                    )}
                />
        <div className="horizontal">
          <Button color='primary' type='submit' variant='contained'>
            {t('login.registration')}
          </Button>
          <BackButton />
        </div>
      </form>
    </div>
  );
};

export default Register;