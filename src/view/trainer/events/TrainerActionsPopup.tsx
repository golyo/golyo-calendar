import { GroupType, TicketSheet, useTrainer } from '../../../hooks/trainer';
import { Avatar, Button, IconButton, Modal } from '@mui/material';
import { AddCircle, Edit as EditIcon } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useMemo, useState } from 'react';
import { TicketNoWarning } from './EventPage';
import { useDialog } from '../../../hooks/dialog';
import { TrainerEvent } from '../../../hooks/event';
import { findOrCreateSheet } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';

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

  const member = useMemo(() => members.find((m) => m.id === memberId), [memberId, members]);

  const sheet = useMemo(() => {
    if (!member) {
      return { } as TicketSheet;
    }
    return findOrCreateSheet(member, groupType);
  }, [groupType, member]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  
  const buyTicket = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.buySeasonTicket'),
      okCallback: () => {
        buySeasonTicket(member!.id, event.groupId);
        closeModal();
      },
    });
  }, [buySeasonTicket, closeModal, event.groupId, member, showConfirmDialog, t]);

  const removeMember = useCallback((ticketBack: boolean) => {
    showConfirmDialog({
      description: t('confirm.removeFromEvent'),
      okCallback: () => {
        removeMemberFromEvent(event, memberId, ticketBack).then((dbEvent) => setEvent!(dbEvent));
        closeModal();
      },
    });
  }, [closeModal, event, memberId, removeMemberFromEvent, setEvent, showConfirmDialog, t]);

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
            {member && <Avatar src={member.avatar} />}
            <span>{member ? member.name : memberId}</span>
          </span>)
        }>
          <div className="vertical">
            {member && <LabelValue label={t('membership.remainingEventNo')}>
              <TicketNoWarning sheet={sheet!} t={t} />
            </LabelValue>}
            {member && <LabelValue label={t('membership.purchasedTicketNo')}>
              <span style={{ paddingRight: '20px' }}>{sheet.purchasedTicketNo}</span>
              <IconButton color="primary" onClick={buyTicket}><AddCircle /></IconButton>
            </LabelValue>}
            <div className="horizontal">
              {event && isStarted() && <Button size="small" onClick={memberMissed} variant="contained">{t('action.memberMissed')}</Button>}
              {event && !isStarted() && <Button size="small" onClick={doRemoveMember} variant="contained">{t('action.removeMember')}</Button>}
              <Button size="small" onClick={closeModal} >{t('common.cancel')}</Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default TrainerActionsPopup;