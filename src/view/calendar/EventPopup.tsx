import * as React from 'react';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useMemo } from 'react';
import ModalContainer from '../common/ModalContainer';
import ModalTitle from '../common/ModalTitle';
import { CalendarEvent, getInterval } from '../../hooks/event';

const EventPopup = ({ event, resetEvent }: { event: CalendarEvent | null, resetEvent: () => void }) => {
  const interval = useMemo(() => event ? getInterval(event) : '', [event]);

  return (
    <Modal
      open={!!event}
      onClose={resetEvent}
    >
      <ModalContainer variant="small">
        <ModalTitle close={resetEvent}>{event?.title}</ModalTitle>
        <Typography sx={{ mt: 2 }}>
          { interval }
        </Typography>
      </ModalContainer>
    </Modal>
  );
};

export default EventPopup;