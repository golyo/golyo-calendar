import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Modal, TextField } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import * as yup from 'yup';
import ModalContainer from '../../common/ModalContainer';
import { DEFAULT_MEMBER, MembershipType, MemberState } from '../../../hooks/trainer';

interface Props {
  updateMembershipState: (member: MembershipType, toState: MemberState | null) => Promise<void>;
}

const NewMemberPopup = ({ updateMembershipState }: Props) => {
  const { t } = useTranslation();
  const schema = useMemo(() => yup.object({
    id: yup.string().email().required(),
    name: yup.string().required(),
  }), []);

  const [open, setOpen] = useState(false);
  const { handleSubmit, control, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema), defaultValues: { ...DEFAULT_MEMBER } });

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    reset({ ...DEFAULT_MEMBER });
    setOpen(false);
  }, [reset]);

  const modifyData = useCallback((newUser) => {
    return updateMembershipState(newUser, MemberState.TRAINER_REQUEST).then(() => closeModal());
  }, [closeModal, updateMembershipState]);

  return (
    <>
      <Button onClick={openModal} variant="contained" startIcon={<AddCircle />}>{t('membership.newMember')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} title={t('membership.newMember')}>
          <form onSubmit={handleSubmit(modifyData)} className="vertical">
            <Controller
              name="id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('login.email')}
                  size="small"
                  variant="outlined"
                  error={!!errors.id}
                  helperText={errors.id?.message}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('login.userName')}
                  size="small"
                  variant="outlined"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <div>
              <Button color="primary" type="submit" variant="contained">
                {t('common.save')}
              </Button>
              <Button color="primary" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>          </form>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default NewMemberPopup;