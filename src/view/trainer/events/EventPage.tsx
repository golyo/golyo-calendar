import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrainerEvent } from '../../../hooks/event';
import { useUser } from '../../../hooks/user';
import { DEFAULT_MEMBER, MembershipType, TicketSheet, useGroup, useTrainer, findOrCreateSheet } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import TrainerActionsPopup from './TrainerActionsPopup';

export const TicketAlert = styled(Alert)(() => ({
  padding: '0px 6px',
  marginTop: '3px',
}));

export function TicketNoWarning({ sheet, t }: { sheet: TicketSheet, t: any }) {
  return (
    <div>
      {sheet?.remainingEventNo > 0 && <Alert variant="outlined" severity="info">{t('event.remainingEventNo', { ticketNo: sheet.remainingEventNo })}</Alert>}
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
  const { group, loadEvent } = useGroup();

  const findSheet = useCallback((member: MembershipType) => findOrCreateSheet(member, group!.groupType), [group]);
  const [event, setEvent] = useState<TrainerEvent | undefined>(undefined);

  const isStarted = useMemo(() => event && Date.now() >= event.startDate.getTime(), [event]);

  const activeMembers = useMemo(() => {
    if (!event || !group || !members) {
      return [];
    }
    return event.memberIds.map((mid) => members!.find((gm) => gm.id === mid) || DEFAULT_MEMBER);
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
      <LabelValue label={t('event.members')}>{event.memberIds.length}</LabelValue>
      <Divider/>
      <List>
        {activeMembers.map((eMember, idx) => (
          <ListItem key={idx}
                    secondaryAction={isStarted && <TrainerActionsPopup
                      memberId={eMember.id}
                      groupType={group!.groupType}
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
