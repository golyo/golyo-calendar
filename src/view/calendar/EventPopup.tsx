import * as React from 'react';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useMemo } from 'react';
import ModalContainer from '../common/ModalContainer';
import { getInterval, TrainerEvent } from '../../hooks/event';
import { Avatar, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Event as EventIcon } from '@mui/icons-material';

const EventPopup = ({ event, resetEvent }: { event: TrainerEvent | null; resetEvent: () => void; }) => {
  const { t } = useTranslation();

  const interval = useMemo(() => event ? getInterval(event) : '', [event]);

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
          {event?.showMembers && (
            <>
              <Typography variant="subtitle2">{t('event.members')}</Typography>
              <Divider />
              {event?.memberNames.map((memberName, idx) => (
                <Typography key={idx} variant="subtitle2">{memberName}</Typography>
              ))}
            </>
          )}
        </div>
      </ModalContainer>
    </Modal>
  );
};

export default EventPopup;