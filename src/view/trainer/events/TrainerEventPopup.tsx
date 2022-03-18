import * as React from 'react';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useCallback, useMemo, useState } from 'react';
import { Avatar, Button, Divider, List, ListItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Event as EventIcon } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import { getInterval, TrainerEvent } from '../../../hooks/event';
import TrainerActionsPopup from './TrainerActionsPopup';
import { GroupType, useTrainer } from '../../../hooks/trainer';
import { useDialog } from '../../../hooks/dialog';
import NewEventMemberPopup from './NewEventMemberPopup';

interface Props {
  selectedEvent: TrainerEvent;
  groupType: GroupType;
  resetEvent: () => void;
}

const TrainerEventPopup = ({ selectedEvent, groupType, resetEvent }: Props) => {
  const { t } = useTranslation();

  const [event, setEvent] = useState<TrainerEvent>(selectedEvent);

  const { activateEvent, deleteEvent, members } = useTrainer();
  
  const { showConfirmDialog } = useDialog();

  const memberNames = useMemo(() => {
    if (!event) {
      return [];
    }
    return event.memberIds.map((mid) => members.find((m) => m.id === mid)?.name || mid);
  }, [event, members]);

  const interval = useMemo(() => event ? getInterval(event) : '', [event]);

  const isStarted = useMemo(() => Date.now() > event.startDate.getTime(), [event.startDate]);

  const doWork = useCallback((confirmKey: string, work: (event: TrainerEvent) => Promise<any>) => {
    showConfirmDialog({
      description: confirmKey,
      okCallback: () => {
        work(event).then(() => {
          resetEvent();
        });
      },
    });
  }, [event, resetEvent, showConfirmDialog]);

  const doActivateEvent = useCallback(() => doWork('confirm.activateEvent', activateEvent), [activateEvent, doWork]);
  const doDeleteEvent = useCallback(() => doWork('confirm.deleteEvent', deleteEvent), [deleteEvent, doWork]);

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
        <div>
          <Typography variant="subtitle1">{event?.text + ' ' + interval}</Typography>
          <Typography variant="subtitle2">{t('event.members')}</Typography>
          <Divider />
          <List>
            {event?.memberIds.map((memberId, idx) => (
              <ListItem key={idx}
                        secondaryAction={<TrainerActionsPopup
                          memberId={memberId}
                          event={event}
                          groupType={groupType}
                          setEvent={setEvent}
                        />}
                        divider
              >
                <Typography key={idx} variant="subtitle2">{memberNames[idx]}</Typography>
              </ListItem>
            ))}
          </List>
          <div className="horizontal">
            {!event.isDeleted && <NewEventMemberPopup event={event} eventChanged={setEvent} />}
            {!isStarted && !event.isDeleted && <Button size="small" variant='outlined' onClick={doDeleteEvent}>{t('common.delete')}</Button>}
            {!isStarted && event.isDeleted && <Button size="small" variant='outlined' onClick={doActivateEvent}>{t('common.activate')}</Button>}
            <Button size="small" onClick={resetEvent}>{t('common.close')}</Button>
          </div>
        </div>
      </ModalContainer>
    </Modal>
  );
};

export default TrainerEventPopup;