import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { findOrCreateSheet, MembershipType, MemberState, useTrainer } from '../../../hooks/trainer';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';
import { getNextEventTo, TrainerEvent } from '../../../hooks/event';
import {
  Avatar,
  Box, Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar, ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Event as EventIcon } from '@mui/icons-material';
import UserAvatar from '../../common/UserAvatar';

interface TicketStat {
  member: MembershipType;
  stat: number;
}

export default function MemberTicketStat<T>() {
  const utils = useUtils<T>();
  const { t } = useTranslation();
  const { eventProvider, members, groups } = useTrainer();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [events, setEvents] = useState<TrainerEvent[]>([]);
  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId)!, [groups, selectedGroupId]);
  const activeMembers = useMemo(() => members.filter((m) => m.state === MemberState.ACCEPTED), [members]);

  const memberStats = useMemo<TicketStat[]>(() => {
    if (!selectedGroup) {
      return [];
    }
    const actEvents = events.filter((e) => e.groupId === selectedGroup.id ||
      (selectedGroup.attachedGroups && selectedGroup.attachedGroups.includes(e.groupId)));
    const stats = activeMembers.filter((m) => m.groups.some((gid) => gid === selectedGroup.id ||
      (selectedGroup.attachedGroups && selectedGroup.attachedGroups.includes(gid)))).map((member) => {
      const memberStat = {
        member,
        stat: 0,
      };
      actEvents.forEach((e) => {
        if (e.memberIds.includes(member.id)) {
          memberStat.stat += 1;
        }
      });
      return memberStat;
    });
    return stats;
  }, [activeMembers, events, selectedGroup]);

  const ticketInfo = useCallback((ms: TicketStat) => {
    const sheet = findOrCreateSheet(ms.member, selectedGroup.groupType);
    return ms.stat + '/' + (ms.stat + sheet.remainingEventNo);
  }, [selectedGroup?.groupType]);

  useEffect(() => {
    eventProvider.getEvents(new Date(), getNextEventTo()).then((dbEvents) => setEvents(dbEvents));
  }, [eventProvider, utils]);

  return (
    <>
      <Typography variant="h3">{t('menu.memberTicketStats')}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div></div>
        <TextField select
                   onChange={(e) => setSelectedGroupId(e.target.value)}
                   value={selectedGroupId}
                   label={t('common.filter')}
                   size="small"
                   variant="standard"
                   sx={{ minWidth: '200px' }}
        >
          <MenuItem value={''}>-</MenuItem>
          {groups.map((group, idx) => (
            <MenuItem key={idx} value={group.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: group.color }}>
                  <EventIcon sx={{ bgcolor: group.color }} ></EventIcon>
                </Avatar>&nbsp;
                <ListItemText primary={group.name} />
              </div>
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <List>
        <Divider />
        {memberStats.map((ms, idx) => (
          <ListItem key={idx}
                    divider
          >
            <ListItemAvatar>
              <UserAvatar userId={ms.member.id} />
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: '10px' }}>
              <div>
                <Typography variant="subtitle1">{ms.member.name}</Typography>
              </div>
              <Chip color="primary"  variant="outlined" label={ticketInfo(ms)}></Chip>
            </div>
          </ListItem>
        ))}
      </List>
    </>
  );
}