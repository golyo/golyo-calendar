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
import { DEFAULT_MEMBER, MembershipType, useGroup } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import TrainerActionsPopup from './TrainerActionsPopup';
import { styled } from '@mui/material/styles';

export const TicketAlert = styled(Alert)(() => ({
  padding: '0px 6px',
  marginTop: '3px',
}));

export function TicketNoWarning({ member, t }: { member: MembershipType, t: TFunction }) {
  return (
    <div>
      {member.remainingEventNo > 0 && <TicketAlert variant="outlined" severity="info">{t('event.remainingEventNo', { ticketNo: member.remainingEventNo })}</TicketAlert>}
      {member.remainingEventNo <= 0 &&
        <TicketAlert variant="outlined" severity="error">{t(member.remainingEventNo < 0 ? 'event.owesTicket' : 'event.noMoreEvent', { ticketNo: -member.remainingEventNo })}</TicketAlert>
      }
    </div>
  );
}

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const { getDateRangeStr } = useUser();
  const { group, loadEvent } = useGroup();

  const [event, setEvent] = useState<TrainerEvent | undefined>(undefined);

  const isStarted = useMemo(() => event && Date.now() >= event.startDate.getTime(), [event]);

  const activeMembers = useMemo(() => {
    if (!event || !group || !group.members) {
      return [];
    }
    return event.members.map((m) => group.members!.find((gm) => gm.id === m.id) || DEFAULT_MEMBER);
  }, [event, group]);

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
                    secondaryAction={isStarted && <TrainerActionsPopup member={eMember} event={event} setEvent={setEvent} />}
                    divider
          >
            <ListItemAvatar>
              <Avatar src={eMember.avatar} />
            </ListItemAvatar>
            <div>
              <Typography variant="subtitle1">{eMember.name}</Typography>
              <TicketNoWarning member={eMember} t={t} />
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
