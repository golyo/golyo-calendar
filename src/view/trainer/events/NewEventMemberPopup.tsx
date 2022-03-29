import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, MenuItem, Modal, TextField, Typography } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { MembershipType, useTrainer } from '../../../hooks/trainer';
import { TrainerEvent } from '../../../hooks/event';
import { getGroupMembers } from '../../../hooks/trainer/GroupProvider';
import LabelValue from '../../common/LabelValue';

enum ChoiceType {
  GROUP_MEMBER = 'GROUP_MEMBER',
  OUTER_MEMBER = 'OUTER_MEMBER',
  OTHER_USER = 'OTHER_USER',
}

const CHOICE_TYPES = Object.values(ChoiceType) as ChoiceType[];

const NewEventMemberPopup = ({ event, eventChanged }: { event: TrainerEvent; eventChanged: (event: TrainerEvent) => void; }) => {
  const { t } = useTranslation();
  const { groups, members, addMemberToEvent } = useTrainer();

  const [choiceType, setChoiceType] = useState<ChoiceType>(ChoiceType.GROUP_MEMBER);

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
    setOpen(false);
  }, []);

  const onSelectChoiceType = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMemberId('');
    setChoiceType(e.target.value as ChoiceType);
  }, []);

  const onSelectMember = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMemberId(e.target.value);
  }, []);

  const doAddMemberToEvent = useCallback(() => {
    if (!memberId) {
      return;
    }
    addMemberToEvent(event, memberId).then((saved) => {
      setMemberId('');
      eventChanged(saved);
      closeModal();
    });
  }, [addMemberToEvent, closeModal, event, eventChanged, memberId]);

  const groupMemberChoice = useCallback((memberChoices: MembershipType[]) => (
    <TextField select onChange={onSelectMember} size="small" value={memberId}>
      <MenuItem value={''}></MenuItem>
      {memberChoices.map((pm, idx) => (
        <MenuItem key={idx} value={pm.id}>{pm.name}</MenuItem>
      ))}
    </TextField>
  ), [memberId, onSelectMember]);

  return (
    <>
      <Button size="small" onClick={openModal} variant="contained" startIcon={<AddCircle />}>{t('event.addMember')}</Button>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="small" close={closeModal} open={open} title={t('event.addMember')}>
          <div className="vertical">
            <Typography variant="h5">{t('event.addGroupMember')}</Typography>
            <LabelValue label={t('event.chooseMemberType')}>
              <TextField select onChange={onSelectChoiceType} size="small" value={choiceType}>
                {CHOICE_TYPES.map((ct, idx) => (
                  <MenuItem key={idx} value={ct}>{t(`addMemberState.${ct}`)}</MenuItem>
                ))}
              </TextField>
            </LabelValue>
            {choiceType === ChoiceType.GROUP_MEMBER && groupMemberChoice(possibleGroupMembers)}
            {choiceType === ChoiceType.OUTER_MEMBER && groupMemberChoice(possibleMembers)}
            {choiceType === ChoiceType.OTHER_USER &&
              <TextField onChange={onSelectMember} size="small" value={memberId}></TextField>
            }
            <div className="horizontal">
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