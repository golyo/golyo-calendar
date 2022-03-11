import { MembershipType, TrainingGroupUIType, useGroup } from '../../../hooks/trainer';
import { Avatar, Button, IconButton, Modal } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useMemo, useState } from 'react';
import { TicketNoWarning } from './EventPage';
import { useDialog } from '../../../hooks/dialog';
import { TrainerEvent } from '../../../hooks/event';

type ActionPopupProps = {
  group: TrainingGroupUIType,
  member: MembershipType;
  event: TrainerEvent;
  setEvent?: (event: TrainerEvent) => void;
};

const TrainerActionsPopup = ({ group, member, event, setEvent } : ActionPopupProps) => {
  const { t } = useTranslation();
  const { buySeasonTicket, removeMemberFromEvent } = useGroup();
  const { showDialog, showConfirmDialog } = useDialog();

  const [open, setOpen] = useState(false);

  const sheet = useMemo(() => member.ticketSheets.find((sh) => sh.type === group.groupType), [group, member]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  
  const isDisabled = useCallback(() => {
    return event.startDate.getTime() > Date.now();
  }, [event]);

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
    removeMemberFromEvent(event.id!, member.id, ticketBack).then((dbEvent) => setEvent!(dbEvent));
    closeModal();
  }, [closeModal, event.id, member.id, removeMemberFromEvent, setEvent]);


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
      <IconButton onClick={openModal} disabled={isDisabled()}>
        <EditIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="small" close={closeModal} title={
          (<span className="horizontal">
            <Avatar src={member.avatar} />
            <span>{member.name}</span>
          </span>)
        }>
          <div className="vertical">
            <TicketNoWarning sheet={sheet!} t={t} />
            <div className="horizontal">
              <Button onClick={buyTicket} variant="contained">{t('action.buySeasonTicket')}</Button>
              {event && <Button onClick={memberMissed} variant="outlined">{t('action.memberMissed')}</Button>}
              <Button onClick={closeModal} >{t('common.cancel')}</Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default TrainerActionsPopup;