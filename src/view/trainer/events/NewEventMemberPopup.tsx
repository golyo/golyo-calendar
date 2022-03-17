import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, MenuItem, Modal, Select, SelectChangeEvent, Typography } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { useTrainer } from '../../../hooks/trainer';
import { TrainerEvent } from '../../../hooks/event';
import { getGroupMembers } from '../../../hooks/trainer/GroupProvider';

const NewEventMemberPopup = ({ event, eventChanged }: { event: TrainerEvent; eventChanged: (event: TrainerEvent) => void; }) => {
  const { t } = useTranslation();
  const { groups, members, addMemberToEvent } = useTrainer();

  const [groupMemberId, setGroupMemberId] = useState<string>('');

  const [memberId, setMemberId] = useState<string>('');

  const group = useMemo(() => groups.find((g) => g.id === event.groupId)!, [event.groupId, groups]);

  const groupMembers = useMemo(() => getGroupMembers(members, group), [group, members]);

  const possibleGroupMembers = useMemo(() => groupMembers.filter((m) =>
    !event.memberIds.includes(m.id)), [event.memberIds, groupMembers]);

  const possibleMembers = useMemo(() => members.filter((m) =>
    !event.memberIds.includes(m.id) && !groupMembers.some((gm) => gm.id === m.id)),
  [event.memberIds, groupMembers, members]);

  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    setMemberId('');
    setGroupMemberId('');
    setOpen(false);
  }, []);

  const onSelectMember = useCallback((e: SelectChangeEvent) => {
    setMemberId(e.target.value);
    setGroupMemberId('');
  }, []);

  const onSelectGroupMember = useCallback((e: SelectChangeEvent) => {
    setGroupMemberId(e.target.value);
    setMemberId('');
  }, []);

  const doAddMemberToEvent = useCallback(() => {
    const toAdd = memberId || groupMemberId;
    if (!toAdd) {
      return;
    }
    addMemberToEvent(event, members.find((m) => m.id === toAdd)!).then((saved) => {
      setMemberId('');
      setGroupMemberId('');
      eventChanged(saved);
      closeModal();
    });
  }, [addMemberToEvent, closeModal, event, eventChanged, groupMemberId, memberId, members]);

  return (
    <>
      <Button size="small" onClick={openModal} variant="contained" startIcon={<AddCircle />}>{t('event.addMember')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="small" close={closeModal} open={open} title={t('event.addMember')}>
          <div className="vertical">
            <Typography variant="h5">{t('event.chooseGroupMember')}</Typography>
            <Select onChange={onSelectGroupMember} size="small" value={groupMemberId}>
              <MenuItem value={''}></MenuItem>
              {possibleGroupMembers.map((pm, idx) => (
                <MenuItem key={idx} value={pm.id}>{pm.name}</MenuItem>
              ))}
            </Select>
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