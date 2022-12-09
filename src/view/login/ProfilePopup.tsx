import React, { useCallback, useMemo, useState } from 'react';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Modal, TextField } from '@mui/material';
import { User, useUser } from '../../hooks/user';
import ModalContainer from '../common/ModalContainer';

const Profile = () => {
  const { t } = useTranslation();
  const { user, saveUser } = useUser();

  const [open, setOpen] = useState(false);

  const schema = useMemo(() => yup.object({
    id: yup.string().required(),
    name: yup.string().required(),
    photoURL: yup.string(),
  }), []);

  const { handleSubmit, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: user,
  });

  const doChanges = useCallback((values: FieldValues) => {
    saveUser(values as User);
  }, [saveUser]);

  if (!user) {
    return <div></div>;
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>{t('common.modify')}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
      >
        <ModalContainer variant="big" open={open} close={() => setOpen(false)} title={t('login.profile')}>
          <form onSubmit={handleSubmit(doChanges)} className="vertical" noValidate>
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
                  helperText={errors.name?.message as string || ''}
                />
              )}
            />
            <div className="horizontal">
              <Button color='primary' type='submit' variant='contained'>
                {t('common.save')}
              </Button>
              <Button onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default Profile;
