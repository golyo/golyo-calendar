import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Badge,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import { Event as EventIcon, Visibility } from '@mui/icons-material';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';

import { useUser } from '../../hooks/user';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFirebase } from '../../hooks/firebase';
import { getNextEventTo, changeMembershipToEvent } from '../../hooks/event';
import { TrainerEvent } from '../../hooks/event';
import { useDialog } from '../../hooks/dialog';
import { isMaxMembershipError } from '../../hooks/event/eventUtil';
import { findOrCreateSheet, GroupType, MemberState } from '../../hooks/trainer';
import { Link } from 'react-router-dom';

interface TicketsValidityType {
  type: GroupType;
  groupId: string;
  groupName: string;
  validity: any;
  trainerId: string;
  trainerName: string;
  remainingNo: number;
}

const NextEvents = () => {
  const { t } = useTranslation();
  const utils = useUtils();
  const { firestore } = useFirebase();
  const { showBackdrop, hideBackdrop, checkIfConfirmDialog, showDialog } = useDialog();
  const [events, setEvents] = useState<TrainerEvent[]>([]);

  const { activeMemberships, userEventProvider, groupMemberships, getDateRangeStr, user, membershipChanged } = useUser();

  const requestedMemberships = useMemo(() => groupMemberships.filter((m) => m.membership.state === MemberState.TRAINER_REQUEST &&
    m.trainerGroups.some((tg) => m.membership.groups.includes(tg.id))), [groupMemberships]);

  const hasChecked = useCallback((event: TrainerEvent) => events.some(
    (check) => check.groupId === event.groupId && check.memberIds.includes(user!.id)), [events, user]);

  const isAccepted = useCallback((event: TrainerEvent) => {
    return user && event.memberIds && event.memberIds.includes(user.id);
  }, [user]);

  const findGroupToEvent = useCallback((event: TrainerEvent) => {
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId)!;
    return membership.trainerGroups.find((gr) => gr.id === event.groupId)!;
  }, [activeMemberships]);

  const ticketsValidities = useMemo(() => {
    return activeMemberships.reduce((validities, m) => {
      m.contactGroups.forEach((g) => {
        const sheet = findOrCreateSheet(m.membership, g.groupType);
        if (g.ticketValidity && sheet.ticketBuyDate) {
          validities.push({
            trainerId: m.trainer.trainerId,
            trainerName: m.trainer.trainerName,
            groupId: g.id,
            groupName: g.name,
            type: g.groupType,
            remainingNo: sheet.remainingEventNo,
            validity: utils.addMonths(utils.date(sheet.ticketBuyDate), g.ticketValidity),
          });
        }
      });
      return validities;
    }, [] as TicketsValidityType[]);
  }, [activeMemberships, utils]);
  
  const warningValities = useMemo(() =>{
    const afterTwoWeek = utils.addWeeks(utils.date(), 2);
    return ticketsValidities.filter((tv) => tv.validity && (utils.isBefore(tv.validity, afterTwoWeek)));
  }, [ticketsValidities, utils]);

  const isTicketValid = useCallback((groupId: string) => {
    const ticketsValidity = ticketsValidities.find((tv) => tv.groupId === groupId);
    return !ticketsValidity || utils.isBefore(utils.date(), ticketsValidity.validity);
  }, [ticketsValidities, utils]);

  const getRemainingEventNo = useCallback((event: TrainerEvent) => {
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId);
    const groupType = membership!.trainerGroups.find((gr) => gr.id === event.groupId)!.groupType;
    const isValid = isTicketValid(event.groupId);
    const no = membership?.membership.ticketSheets?.find((sh) => sh.type === groupType)?.remainingEventNo || 0;
    return isValid ? no : Math.min(no, 0);
  }, [activeMemberships, isTicketValid]);

  const remainingEventNos: number[] = useMemo(() => events.map((event) => getRemainingEventNo(event)),
    [events, getRemainingEventNo]);

  const handleChange = useCallback((event: TrainerEvent) => (e: any) => {
    const isAdd = e.target.checked;
    const group = findGroupToEvent(event);
    const membership = activeMemberships.find((gm) => gm.trainer.trainerId === event.trainerId)!;
    const maxDiff = group.cancellationDeadline * 60 * 60 * 1000;
    if (Date.now() + maxDiff > event.startDate.getTime()) {
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
    const remainingEventNo = getRemainingEventNo(event);
    if (isAdd && remainingEventNo <= 0 && hasChecked(event)) {
      showDialog({
        title: 'common.warning',
        description: 'warning.selectionExistsNoTicket',
      });
      return;
    }
    checkIfConfirmDialog({
      description: t('confirm.noMoreTicket'),
      isShowDialog: () => isAdd && remainingEventNo <= 0,
      doCallback: () => {
        showBackdrop();
        const isExpired = !isTicketValid(event.groupId);
        changeMembershipToEvent(firestore, event, user!, membership!, isAdd, isExpired).then(() => {
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
  }, [activeMemberships, checkIfConfirmDialog, findGroupToEvent, firestore, getRemainingEventNo, hasChecked,
    hideBackdrop, isTicketValid, membershipChanged, showBackdrop, showDialog, t, user]);

  useEffect(() => {
    if (userEventProvider.getEvents) {
      userEventProvider.getEvents(new Date(), getNextEventTo()).then((tevents: TrainerEvent[]) => setEvents(tevents.filter((e) => !e.isDeleted )));
    }
  }, [userEventProvider]);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.nextEvents')}</Typography>
      {warningValities.map((wv, idx) => (
        <Alert key={idx} severity="warning">
          {t('warning.ticketExpiredWarning', {
            date: utils.formatByString(wv.validity, utils.formats.shortDate),
            trainer: wv.trainerName,
            group: wv.groupName,
          })}
        </Alert>
      ))}
      <List>
        {requestedMemberships.map((membership, idx) => (
          <ListItem key={idx}
                    component={Link}
                    to={'/memberships'}
                    secondaryAction={
                      <IconButton color="primary"><Visibility /></IconButton>
                    }
          >
            <ListItemText>
              <Alert severity="warning">
                {t('warning.trainerRequestExists', { trainer: membership.trainer.trainerName })}
              </Alert>
            </ListItemText>
          </ListItem>
        ))}
        {events.map((event, idx) => (
          <ListItem key={idx}
                    secondaryAction={
                      <Badge badgeContent={event.showMembers && event.memberIds.length.toString()} color="primary">
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
                  {event.text} - {getDateRangeStr(event)}
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
