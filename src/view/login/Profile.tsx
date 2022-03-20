import React, { useCallback, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { useUser } from '../../hooks/user';
import { useAuth } from '../../hooks/auth';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import FlagIcon from '../../menu/FlagIcon';
import LabelValue from '../common/LabelValue';
import TrainerBaseData from '../trainer/TrainerBaseData';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { isPasswordEnabled } = useAuth();
  const { user, saveUser } = useUser();

  const [language, setLanguage] = React.useState(i18n.language);

  const schema = useMemo(() => yup.object({
    id: yup.string().required(),
    name: yup.string().required(),
    photoURL: yup.string(),
  }), []);

  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: user,
  });

  const handleChangeLanguage = useCallback((event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  }, [i18n]);

  const doChanges = useCallback((values) => {
    saveUser(values);
  }, [saveUser]);

  const trainerRegistration = useCallback(() => {
    if (!user) {
      return;
    }
    const toSave = { ...user, registeredAsTrainer: true };
    return saveUser(toSave);
  }, [saveUser, user]);

  if (!user) {
    return <div></div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(doChanges)} className="vertical" noValidate>
        <LabelValue label={t('common.language')}>
          <Select
            value={language}
            onChange={handleChangeLanguage}
            variant="standard"
          >
            <MenuItem value="hu">
              <FlagIcon code="hu" />&nbsp;&nbsp;magyar
            </MenuItem>
            <MenuItem value="en">
              <FlagIcon code="gb" />&nbsp;&nbsp;english
            </MenuItem>
          </Select>
        </LabelValue>
        <Typography variant="h3">{t('login.profile')}</Typography>
        <Controller
          name="id"
          control={control}
          defaultValue={user.id}
          render={({ field }) => (
            <TextField
              { ...field }
              label={t('login.email')}
              size="small"
              variant="outlined"
              required
              disabled
            />
          )}
        />
        <Controller
          name={'name'}
          control={control}
          defaultValue={user.name}
          render={({ field }) => (
            <TextField
              { ...field }
              required
              label={t('login.userName')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
        <Controller
          name={'photoURL'}
          control={control}
          defaultValue={user.photoURL}
          render={({ field }) => (
            <TextField
              { ...field }
              label={t('login.photoURL')}
            />
          )}
        />
        <div className="horizontal">
          <Button color='primary' type='submit' variant='contained'>
            {t('common.save')}
          </Button>
        </div>

        { isPasswordEnabled() && <Link to="changePassword">{t('login.changePassword')}</Link> }
      </form>
      <Paper sx={{ marginTop: '40px', padding: '20px' }}>
        {!user.isTrainer && <div>
          {!user.registeredAsTrainer && <div className="vertical">
            <div>{t('trainer.registrationInfo')}</div>
            <div>
              <Button color="primary" variant="contained" onClick={trainerRegistration} disabled={!user.location}>
                {t('common.register')}
              </Button>
            </div>
          </div>}
          {user.registeredAsTrainer && <div>
            {t('trainer.waitingApprovalText')}
          </div>}
        </div>}
        {user.isTrainer && <div>
          {t('trainer.approvedText')}
        </div>}
      </Paper>
      {user.isTrainer && <TrainerBaseData />}
    </div>
  );
};

export default Profile;
