import React, { useCallback, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Typography } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTrainer } from '../../hooks/trainer';

const TrainerBaseData = () => {
  const { t } = useTranslation();

  const { trainerData, saveTrainerData } = useTrainer();

  const schema = useMemo(() => yup.object({
    id: yup.string().required(),
    name: yup.string().required(),
    country: yup.string(),
    zipCode: yup.string(),
  }), []);

  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: trainerData,
  });

  const doChanges = useCallback((values) => {
    saveTrainerData(values);
  }, [saveTrainerData]);

  if (!trainerData) {
    return <div></div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(doChanges)} className="vertical" noValidate>
        <Typography variant="h3">{t('login.profile')}</Typography>
        <Controller
          name="id"
          control={control}
          defaultValue={trainerData.id}
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
          defaultValue={trainerData.name}
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
        <div className="horizontal">
          <Button color='primary' type='submit' variant='contained'>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TrainerBaseData;