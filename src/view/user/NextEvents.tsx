import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Chip, List, ListItem, ListItemAvatar, Switch, Typography } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';

import { useUser } from '../../hooks/user';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFirebase } from '../../hooks/firebase';
import { getNextEventTo, changeMembershipToEvent } from '../../hooks/event';
import { TrainerEvent } from '../../hooks/event';
import { useDialog } from '../../hooks/dialog';
import { isMaxMembershipError } from '../../hooks/event/eventUtil';

const NextEvents = () => {
  const { t } = useTranslation();
  const { firestore } = useFirebase();
  const { showBackdrop, hideBackdrop, checkIfConfirmDialog, showDialog } = useDialog();
  const [events, setEvents] = useState<TrainerEvent[]>([]);

  const { userEventProvider, activeMemberships, getDateRangeStr, user, membershipChanged } = useUser();

  const hasChecked = useCallback((event: TrainerEvent) => events.some(
    (check) => check.groupId === event.groupId && check.members.some(
      (member) => member.id === user!.id)), [events, user]);

  const isAccepted = useCallback((event: TrainerEvent) => {
    return user && event.members && !!event.members.find((member) => member.id === user.id);
  }, [user]);

  const remainingEventNos: number[] = useMemo(() => events.map((event) => activeMemberships.find(
    (gm) => gm.groupId === event.groupId)!.membership.remainingEventNo), [activeMemberships, events]);

  const handleChange = useCallback((event: TrainerEvent) => (e: any) => {
    const isAdd = e.target.checked;
    const membership = activeMemberships.find((gm) => gm.groupId === event.groupId);
    if (isAdd && membership!.membership.remainingEventNo <= 0 && hasChecked(event)) {
      showDialog({
        title: 'common.warning',
        description: 'warning.selectionExistsNoTicket',
      });
      return;
    }
    checkIfConfirmDialog({
      description: t('confirm.noMoreTicket'),
      isShowDialog: () => isAdd && membership!.membership.remainingEventNo <= 0,
      doCallback: () => {
        showBackdrop();
        changeMembershipToEvent(firestore, event, user!, membership!, isAdd).then(() => {
          membershipChanged();
          hideBackdrop(isAdd ? 'membership.checkinApproved' : 'membership.checkoutApproved');
          if (isAdd && membership!.membership.remainingEventNo === 0) {
            showDialog({
              title: 'common.warning',
              description: 'warning.consultTrainer',
            });
          }
        }).catch((err) => {
          hideBackdrop();
          if (isMaxMembershipError(err)) {
            showDialog({
              title: 'common.warning',
              description: 'warning.maxMembershipError',
            });
            return;
          }
          throw err;
        });
      },
    });
  }, [activeMemberships, checkIfConfirmDialog, firestore, hasChecked, hideBackdrop, membershipChanged, showBackdrop, showDialog, t, user]);

  useEffect(() => {
    userEventProvider.getEvents(new Date(), getNextEventTo()).then((tevents: TrainerEvent[]) => setEvents(tevents));
  }, [userEventProvider]);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.nextEvents')}</Typography>
      <List>
        {events.map((event, idx) => (
          <ListItem key={idx}
                    secondaryAction={
                      <Badge badgeContent={event.members.length.toString()} color="primary">
                        <Switch
                          color="secondary"
                          checked={isAccepted(event)}
                          onChange={handleChange(event)}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                      </Badge>
                    }
                    divider
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: event.color }}>
                <EventIcon></EventIcon>
              </Avatar>
            </ListItemAvatar>
            <div className="horizontal" style={{ justifyContent: 'space-between', width: '100%', paddingRight: '30px' }}>
              <div>
                <Typography variant="subtitle1">{event.title}</Typography>
                <Typography variant="subtitle2">
                  {event.text + ' - ' + getDateRangeStr(event)}
                </Typography>
              </div>
              <div>
                <Typography variant="subtitle1">{t('membership.ticketNo')}</Typography>
                <Typography variant="subtitle2">
                  <Chip label={remainingEventNos[idx]}
                        color={remainingEventNos[idx] > 0 ? 'primary' : 'error'} />
                </Typography>
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default NextEvents;
