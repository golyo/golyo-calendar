import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, MenuItem, Modal, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import * as yup from 'yup';
import ModalContainer from '../../common/ModalContainer';
import {
  DEFAULT_MEMBER,
  MemberState,
  useGroup,
  useTrainer,
} from '../../../hooks/trainer';

const NewMemberPopup = () => {
  const { t } = useTranslation();
  const schema = useMemo(() => yup.object({
    id: yup.string().email().required(),
    name: yup.string().required(),
  }), []);

  const { groupMembers, updateMembershipState } = useGroup();

  const { members } = useTrainer();

  const possibleMembers = useMemo(() => {
    return members.filter((member) => !groupMembers.some((gm) => gm.id === member.id));
  }, [groupMembers, members]);

  const [open, setOpen] = useState(false);
  const { handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...DEFAULT_MEMBER },
  });

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    reset({ ...DEFAULT_MEMBER });
    setOpen(false);
  }, [reset]);

  const modifyData = useCallback((newUser) => {
    closeModal();
    return updateMembershipState(newUser, MemberState.TRAINER_REQUEST);
  }, [closeModal, updateMembershipState]);

  const onSelectMember = useCallback((e: SelectChangeEvent) => {
    const member = possibleMembers.find((m) => m.id === e.target.value);
    reset({
      ...DEFAULT_MEMBER,
      id: member?.id,
      name: member?.name,
    });
  }, [possibleMembers, reset]);

  return (
    <>
      <Button onClick={openModal} variant="contained" startIcon={<AddCircle />}>{t('membership.newMember')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} title={t('membership.newMember')}>
          {possibleMembers.length > 0 && <div className="vertical">
            <Typography variant="h5">{t('membership.addOtherGroupMember')}</Typography>
            <Select onChange={onSelectMember} size="small" defaultValue={'-'}>
              <MenuItem value={'-'}>-</MenuItem>
              {possibleMembers.map((pm, idx) => (
                <MenuItem key={idx} value={pm.id}>{pm.name}</MenuItem>
              ))}
            </Select>
            <div></div>
          </div>}
          <form onSubmit={handleSubmit(modifyData)} className="vertical">
            <Typography variant="h5">{t('membership.inviteMember')}</Typography>
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