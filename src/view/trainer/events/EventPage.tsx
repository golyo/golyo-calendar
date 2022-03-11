import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TFunction, useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Typography,
} from '@mui/material';

import { TrainerEvent } from '../../../hooks/event';
import { useUser } from '../../../hooks/user';
import { DEFAULT_MEMBER, useGroup, useTrainer } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import TrainerActionsPopup from './TrainerActionsPopup';
import { styled } from '@mui/material/styles';
import { TicketSheet } from '../../../hooks/trainer/TrainerContext';

export const TicketAlert = styled(Alert)(() => ({
  padding: '0px 6px',
  marginTop: '3px',
}));

export function TicketNoWarning({ sheet, t }: { sheet: TicketSheet, t: TFunction }) {
  return (
    <div>
      {sheet?.remainingEventNo > 0 && <TicketAlert variant="outlined" severity="info">{t('event.remainingEventNo', { ticketNo: sheet.remainingEventNo })}</TicketAlert>}
      {sheet?.remainingEventNo <= 0 &&
        <TicketAlert variant="outlined" severity="error">{t(sheet.remainingEventNo < 0 ? 'event.owesTicket' : 'event.noMoreEvent', { ticketNo: -sheet.remainingEventNo })}</TicketAlert>
      }
    </div>
  );
}

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const { getDateRangeStr } = useUser();
  const { members } = useTrainer();
  const { group, loadEvent, findSheet } = useGroup();

  const [event, setEvent] = useState<TrainerEvent | undefined>(undefined);

  const isStarted = useMemo(() => event && Date.now() >= event.startDate.getTime(), [event]);

  const activeMembers = useMemo(() => {
    if (!event || !group || !members) {
      return [];
    }
    return event.members.map((m) => members!.find((gm) => gm.id === m.id) || DEFAULT_MEMBER);
  }, [event, group, members]);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    loadEvent(eventId).then((dbEvent) => {
      setEvent(dbEvent);
    });
  }, [eventId, loadEvent]);

  if (!event || !group) {
    return null;
  }

  return (
    <div className="vertical">
      <Typography variant="h5">{t('event.details')}</Typography>
      <LabelValue label={t('event.time')}>{getDateRangeStr(event)}</LabelValue>
      <LabelValue label={t('event.members')}>{event.members.length}</LabelValue>
      <Divider/>
      <List>
        {activeMembers.map((eMember, idx) => (
          <ListItem key={idx}
                    secondaryAction={isStarted && <TrainerActionsPopup
                      member={eMember}
                      event={event}
                      setEvent={setEvent}
                    />}
                    divider
          >
            <ListItemAvatar>
              <Avatar src={eMember.avatar} />
            </ListItemAvatar>
            <div>
              <Typography variant="subtitle1">{eMember.name}</Typography>
              <TicketNoWarning sheet={findSheet(eMember)} t={t} />
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
