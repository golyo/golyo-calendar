import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, MenuItem, Modal, Select, SelectChangeEvent, Typography } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { useTrainer } from '../../../hooks/trainer';
import { TrainerEvent } from '../../../hooks/event';

const NewEventMemberPopup = ({ event, eventChanged }: { event: TrainerEvent; eventChanged: (event: TrainerEvent) => void; }) => {
  const { t } = useTranslation();
  const { members, addMemberToEvent } = useTrainer();

  const [memberId, setMemberId] = useState<string>('');

  const possibleMembers = useMemo(() => {
    return members.filter((m) => !event.members.some((em) => em.id === m.id));
  }, [event.members, members]);

  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    setMemberId('');
    setOpen(false);
  }, []);

  const onSelectMember = useCallback((e: SelectChangeEvent) => {
    setMemberId(e.target.value);
  }, []);

  const doAddMemberToEvent = useCallback(() => {
    if (!memberId) {
      return;
    }
    addMemberToEvent(event, members.find((m) => m.id === memberId)!).then((saved) => {
      setMemberId('');
      eventChanged(saved);
      closeModal();
    });
  }, [addMemberToEvent, closeModal, event, eventChanged, memberId, members]);

  return (
    <>
      <Button size="small" onClick={openModal} variant="contained" startIcon={<AddCircle />}>{t('event.addMember')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer close={closeModal} open={open} title={t('event.addMember')}>
          <div className="vertical">
            <Typography variant="h5">{t('event.chooseMember')}</Typography>
            <Select onChange={onSelectMember} size="small" value={memberId}>
              <MenuItem value={''}></MenuItem>
              {possibleMembers.map((pm, idx) => (
                <MenuItem key={idx} value={pm.id}>{pm.name}</MenuItem>
              ))}
            </Select>
            <div>
              <Button size="small" color="primary" onClick={doAddMemberToEvent} variant="contained">
                {t('common.save')}
              </Button>
              <Button size="small" color="primary" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default NewEventMemberPopup;