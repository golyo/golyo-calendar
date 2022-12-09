import React, { useCallback } from 'react';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import { Navigate, useNavigate  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@mui/material';
import { AuthState, useAuth } from '../../hooks/auth';
import BackButton from '../common/BackButton';

const PasswordChange = () => {
  const navigate = useNavigate();
  const { handleSubmit, control, setError, formState: { errors } } = useForm();
  const { t } = useTranslation();
  const { authUser, authState, updatePassword } = useAuth();

  const changePassword = useCallback((values: FieldValues) => {
    const { oldPassword, newPassword, passwordCheck } = values;
    if (newPassword !== passwordCheck) {
      setError('passwordCheck', {
        type: 'manual',
        message: t('login.error.passwordCheck')!,
      });
      return;
    }
    updatePassword(oldPassword, newPassword).then(() => {
      // TODO clear error messages ?
      navigate('/registrationSuccess?action=changePassword');
    }).catch((err: any) => {
      if (err.code.endsWith('wrong-password')) {
        setError('oldPassword', {
          type: 'manual',
          message: t(`login.error.${err.code}`)!,
        });
      } else {
        setError('newPassword', {
          type: 'manual',
          message: t(`login.error.${err.code}`)!,
        });
      }
    });
  }, [navigate, updatePassword, setError, t]);

  if (authState === AuthState.AUTHORIZED) {
    return <Navigate to="/verification"></Navigate>;
  }
  if (!authUser) {
    return <Navigate to="/login"></Navigate>;
  }
  return (
    <div>
      <form onSubmit={handleSubmit(changePassword)} className="vertical">
        <h2>{t('login.changePassword')}</h2>
        <TextField
          value={authUser.email}
          label={t('login.email')}
          disabled
        />
        <Controller
          name={'oldPassword'}
          control={control}
          defaultValue=""
          render={({ field: { onChange, value } }) => (
            <TextField
              onChange={onChange}
              value={value}
              type='password'
              label={t('login.oldPassword')}
              required
              error={!!errors.oldPassword}
              helperText={errors.oldPassword?.message as string || ''}
            />
          )}
        />
        <Controller
          name={'newPassword'}
          control={control}
          defaultValue=""
          render={({ field: { onChange, value } }) => (
            <TextField
              onChange={onChange}
              value={value}
              type='password'
              label={t('login.newPassword')}
              required
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message as string || ''}
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
              helperText={errors.passwordCheck?.message as string || ''}
            />
          )}
        />
        <div className="horizontal">
          <Button color='primary' type='submit' variant='contained'>
            {t('login.changePassword')}
          </Button>
          <BackButton/>
        </div>
      </form>
    </div>
  );
};

export default PasswordChange;