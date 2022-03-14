import * as React from 'react';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useMemo } from 'react';
import ModalContainer from '../common/ModalContainer';
import { getInterval, TrainerEvent } from '../../hooks/event';
import { Avatar, Button, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Event as EventIcon } from '@mui/icons-material';

const EventPopup = ({ event, resetEvent, detailsAction }: { event: TrainerEvent | null; resetEvent: () => void; detailsAction?: () => void }) => {
  const { t } = useTranslation();
  const interval = useMemo(() => event ? getInterval(event) : '', [event]);

  const isStarted = useMemo(() => event && Date.now() >= event.startDate.getTime(), [event]);

  return (
    <Modal
      open={!!event}
      onClose={resetEvent}
    >
      <ModalContainer variant="small" open={!!event} close={resetEvent} title={(
        <>
          <Avatar sx={{ bgcolor: event?.color }}>
            <EventIcon></EventIcon>
          </Avatar>
          <span>{event?.title}</span>
        </>
      )}>
        <div className="vertical">
          <Typography variant="subtitle1">{event?.text + ' ' + interval}</Typography>
          <Typography variant="subtitle2">{t('event.members')}</Typography>
          <Divider />
          {event?.members.map((member, idx) => (
            <Typography key={idx} variant="subtitle2">{member.name}</Typography>
          ))}
          {isStarted && detailsAction && <div><Button onClick={detailsAction} variant="contained">{t('common.modify')}</Button></div>}
        </div>
      </ModalContainer>
    </Modal>
  );
};

export default EventPopup;