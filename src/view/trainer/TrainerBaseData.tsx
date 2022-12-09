import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Button, createFilterOptions, Modal, TextField } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTrainer } from '../../hooks/trainer';
import ModalContainer from '../common/ModalContainer';

const ipApi = () => {
  return fetch('http://ip-api.com/json').then((res) => res.json());
};

const TrainerBaseData = () => {
  const { t: tc, i18n } = useTranslation(['countries']);
  const { t } = useTranslation();
  const { trainerData, saveTrainerData } = useTrainer();

  const [open, setOpen] = useState(false);

  const schema = useMemo(() => yup.object({
    id: yup.string().required(),
    name: yup.string().required(),
    country: yup.string().required(),
    zipCode: yup.string().required(),
    address: yup.string().required(),
  }), []);

  const { handleSubmit, control, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: trainerData,
  });

  const filterOptions = useMemo(() => createFilterOptions({
    matchFrom: 'start',
    stringify: (option: string) => tc(option, ['countries']),
  }), [tc]);

  const countries = useMemo(() => {
    // force lazy load
    tc('HU', ['countries']);
    const cs = i18n.getResourceBundle(i18n.language, 'countries');
    return cs ? Object.keys(cs) : [];
  }, [i18n, tc]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const doChanges = useCallback((values: any) => {
    saveTrainerData(values).then(() => closeModal());
  }, [closeModal, saveTrainerData]);

  useEffect(() => {
    if (!trainerData) {
      return;
    }
    if (!trainerData.country) {
      ipApi().then((ipResult: any) => {
        if (true) {
          setValue('country', ipResult.countryCode);
        }
      });
    }
  }, [i18n, setValue, t, trainerData]);

  if (!trainerData) {
    return <div></div>;
  }

  return (
    <>
      <Button variant="contained" onClick={openModal}>{t('trainer.trainerData')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" open={open} close={closeModal} title={t('trainer.trainerData')}>
          <form onSubmit={handleSubmit(doChanges)} className="vertical" noValidate>
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
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  { ...field }
                  size="small"
                  required
                  label={t('trainer.trainingName')}
                  error={!!errors.name}
                  helperText={errors.name?.message as string || ''}
                />
              )}
            />
            <Controller
              control={control}
              name="country"
              render={({ field }) =>
                <Autocomplete
                  {...field}
                  size="small"
                  sx={{ width: '100%' }}
                  value={field.value || null}
                  filterOptions={filterOptions}
                  options={countries}
                  getOptionLabel={(option) => tc(option, ['countries'])}
                  onChange={(e, values) => setValue('country', values || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('trainer.country')}
                      error={!!errors.country}
                      helperText={errors.country?.message as string || ''}
                    />
                  )}
                />
              }
            />
            <Controller
              name="zipCode"
              control={control}
              render={({ field }) => (
                <TextField
                  { ...field }
                  size="small"
                  required
                  label={t('trainer.zipCode')}
                  error={!!errors.zipCode}
                  helperText={errors.zipCode?.message as string || ''}
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  { ...field }
                  size="small"
                  required
                  label={t('trainer.address')}
                  error={!!errors.address}
                  helperText={errors.address?.message as string || ''}
                />
              )}
            />
            <div className="horizontal">
              <Button type='submit' variant='contained'>
                {t('common.save')}
              </Button>
              <Button onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default TrainerBaseData;