import { MembershipType, useGroup } from '../../../hooks/trainer';
import { Avatar, Button, IconButton, Modal } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import ModalTitle from '../../common/ModalTitle';
import ModalContainer from '../../common/ModalContainer';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useState } from 'react';
import { TicketNoWarning } from './EventPage';
import { useDialog } from '../../../hooks/dialog';
import { TrainerEvent } from '../../../hooks/event';

type ActionPopupProps = {
  member: MembershipType;
  eventId?: string;
  setEvent?: (event: TrainerEvent) => void;
};

const TrainerActionsPopup = ({ member, eventId, setEvent } : ActionPopupProps) => {
  const { t } = useTranslation();
  const { buySeasonTicket, removeMemberFromEvent } = useGroup();
  const { showDialog, showConfirmDialog } = useDialog();

  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const buyTicket = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.buySeasonTicket'),
      okCallback: () => {
        buySeasonTicket(member.id);
        closeModal();
      },
    });
  }, [buySeasonTicket, closeModal, member.id, showConfirmDialog, t]);

  const removeMember = useCallback((ticketBack: boolean) => {
    removeMemberFromEvent(eventId!, member.id, ticketBack).then((event) => setEvent!(event));
    closeModal();
  }, [closeModal, eventId, member.id, removeMemberFromEvent, setEvent]);


  const memberMissed = useCallback(() => {
    showDialog({
      title: 'common.confirm',
      description: 'confirm.memberMissed',
      buttons: [
        { 
          label: 'common.yes',
          onClick: () => removeMember(false),
        }, {
          label: 'common.no',
          onClick: () => removeMember(true),
        }, {
          label: 'common.back',
        },
      ],
    });

  }, [removeMember, showDialog]);

  return (
    <>
      <IconButton onClick={openModal}>
        <EditIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big">
          <ModalTitle close={closeModal}>
            <span className="horizontal">
              <Avatar src={member.avatar} />
              <span>{member.name}</span>
            </span>
          </ModalTitle>
          <div className="vertical">
            <TicketNoWarning member={member} t={t} />
            <div className="horizontal">
              <Button onClick={buyTicket} variant="contained">{t('action.buySeasonTicket')}</Button>
              {eventId && <Button onClick={memberMissed} variant="outlined">{t('action.memberMissed')}</Button>}
              <Button onClick={closeModal} >{t('common.cancel')}</Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default TrainerActionsPopup;