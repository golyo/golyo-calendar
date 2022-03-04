import React, { useEffect, useState } from 'react';
import { getNextEventFrom, getNextEventTo, TrainerEvent } from '../../../hooks/event';
import { Avatar, Badge, IconButton, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../../hooks/user';
import { useTrainer } from '../../../hooks/trainer';
import { Event as EventIcon, Groups } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';

export default function TrainerEvents() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { getDateRangeStr } = useUser();
  const { eventProvider } = useTrainer();
  const [events, setEvents] = useState<TrainerEvent[]>([]);
  
  useEffect(() => {
    eventProvider.setGroupRestriction(groupId);
    eventProvider.getEvents(getNextEventFrom(120), getNextEventTo()).then((tevents: TrainerEvent[]) => setEvents(tevents));
  }, [eventProvider, groupId]);

  return (
    <div className="vertical">
      <Typography variant={groupId ? 'h5' : 'h3'}>{t('trainer.nextEvents')}</Typography>
      <List>
        {events.map((event, idx) => (
          <ListItem key={idx}
                    secondaryAction={
                      <IconButton component={Link} to={`/group/${event.groupId}/event/${event.id}`}>
                        <Badge badgeContent={event.members.length.toString()} color="primary">
                          <Groups />
                        </Badge>
                      </IconButton>
                    }
                    divider
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: event.color }}>
                <EventIcon></EventIcon>
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={event.text} secondary={
              <>
                {getDateRangeStr(event)}
              </>
            } />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
