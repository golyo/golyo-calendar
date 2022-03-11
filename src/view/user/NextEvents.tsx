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

  const findGroupToEvent = useCallback((event: TrainerEvent) => {
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId)!;
    return membership.dbGroups.find((gr) => gr.id === event.groupId)!;
  }, [activeMemberships]);

  const getRemainingEventNo = useCallback((event: TrainerEvent) => {
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId)!;
    const groupType = membership.dbGroups.find((gr) => gr.id === event.groupId)!.groupType;
    return membership.membership.ticketSheets?.find((sh) => sh.type === groupType)?.remainingEventNo || 0;
  }, [activeMemberships]);

  const remainingEventNos: number[] = useMemo(() => events.map((event) => getRemainingEventNo(event)),
    [events, getRemainingEventNo]);

  const handleChange = useCallback((event: TrainerEvent) => (e: any) => {
    const isAdd = e.target.checked;
    const group = findGroupToEvent(event);
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId)!;
    const maxDiff = group.cancellationDeadline * 60 * 60 * 1000;
    if (!isAdd && (Date.now() + maxDiff > event.startDate.getTime())) {
      showDialog({
        title: 'common.warning',
        description: 'warning.cancellationOutranged',
      });
      return;
    }
    if (isAdd && (Date.now() > event.startDate.getTime())) {
      showDialog({
        title: 'common.warning',
        description: 'warning.joinRequestOutranged',
      });
      return;
    }
    if (isAdd && getRemainingEventNo(event) <= 0 && hasChecked(event)) {
      showDialog({
        title: 'common.warning',
        description: 'warning.selectionExistsNoTicket',
      });
      return;
    }
    const remainingEventNo = membership.membership.ticketSheets.find((sh) => sh.type === group.groupType)?.remainingEventNo || 0;
    checkIfConfirmDialog({
      description: t('confirm.noMoreTicket'),
      isShowDialog: () => isAdd && remainingEventNo <= 0,
      doCallback: () => {
        showBackdrop();
        changeMembershipToEvent(firestore, event, user!, membership!, isAdd).then(() => {
          membershipChanged();
          hideBackdrop(isAdd ? 'membership.checkinApproved' : 'membership.checkoutApproved');
          if (isAdd && remainingEventNo === 0) {
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
  }, [
    activeMemberships,
    checkIfConfirmDialog,
    findGroupToEvent,
    firestore,
    getRemainingEventNo,
    hasChecked,
    hideBackdrop,
    membershipChanged,
    showBackdrop,
    showDialog,
    t,
    user,
  ]);

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
