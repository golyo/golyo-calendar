import { GroupType, useTrainer } from '../../../hooks/trainer';
import { Avatar, Button, IconButton, Modal } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useMemo, useState } from 'react';
import { TicketNoWarning } from './EventPage';
import { useDialog } from '../../../hooks/dialog';
import { TrainerEvent } from '../../../hooks/event';
import { findOrCreateSheet } from '../../../hooks/trainer';

type ActionPopupProps = {
  memberId: string;
  groupType: GroupType;
  event: TrainerEvent;
  setEvent: (event: TrainerEvent) => void;
};

const TrainerActionsPopup = ({ memberId, event, groupType, setEvent } : ActionPopupProps) => {
  const { t } = useTranslation();
  const { members, buySeasonTicket, removeMemberFromEvent } = useTrainer();
  const { showDialog, showConfirmDialog } = useDialog();

  const [open, setOpen] = useState(false);

  const isStarted = useCallback(() => event.startDate.getTime() < Date.now(), [event]);

  const member = useMemo(() => members.find((m) => m.id === memberId)!, [memberId, members]);

  const sheet = useMemo(() => findOrCreateSheet(member, groupType), [groupType, member]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  
  const buyTicket = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.buySeasonTicket'),
      okCallback: () => {
        buySeasonTicket(member.id, event.groupId);
        closeModal();
      },
    });
  }, [buySeasonTicket, closeModal, event.groupId, member.id, showConfirmDialog, t]);

  const removeMember = useCallback((ticketBack: boolean) => {
    removeMemberFromEvent(event.id!, groupType, member.id, ticketBack).then((dbEvent) => setEvent!(dbEvent));
    closeModal();
  }, [closeModal, event.id, groupType, member.id, removeMemberFromEvent, setEvent]);

  const doRemoveMember = useCallback(() => removeMember(true), [removeMember]);

  const memberMissed = useCallback(() => {
    showDialog({
      title: 'common.confirm',
      description: 'confirm.memberMissed',
      buttons: [
        { 
          label: 'common.yes',
          onClick: () => removeMember(true),
        }, {
          label: 'common.no',
          onClick: () => removeMember(false),
        }, {
          label: 'common.back',
        },
      ],
    });

  }, [removeMember, showDialog]);

  return (
    <>
      <IconButton onClick={openModal} color="primary">
        <EditIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="small" open={open} close={closeModal} title={
          (<span className="horizontal">
            <Avatar src={member.avatar} />
            <span>{member.name}</span>
          </span>)
        }>
          <div className="vertical">
            <TicketNoWarning sheet={sheet!} t={t} />
            <div className="horizontal">
              <Button size="small" onClick={buyTicket} variant="contained">{t('action.buySeasonTicket')}</Button>
              {event && isStarted() && <Button size="small" onClick={memberMissed} variant="outlined">{t('action.memberMissed')}</Button>}
              {event && !isStarted() && <Button size="small" onClick={doRemoveMember} variant="outlined">{t('action.removeMember')}</Button>}
              <Button size="small" onClick={closeModal} >{t('common.cancel')}</Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default TrainerActionsPopup;