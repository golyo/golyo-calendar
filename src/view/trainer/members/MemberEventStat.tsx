import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { findOrCreateSheet, MembershipType, MemberState, useTrainer } from '../../../hooks/trainer';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { TrainerEvent } from '../../../hooks/event';
import {
  Avatar,
  Box, Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar, ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AddCircle, Event as EventIcon } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDialog } from '../../../hooks/dialog';
import { TicketNoWarning } from '../events/EventPage';
import UserAvatar from '../../common/UserAvatar';

interface MemberStat {
  member: MembershipType;
  stat: number;
  allNo: number;
}

export default function MemberEventStat<T>() {
  const utils = useUtils<T>();
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();
  const { eventProvider, members, groups, updateMembership } = useTrainer();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const thisMonth = useMemo(() => utils.startOfMonth(utils.date(new Date())!), [utils]);

  const [monthStart, setMonthStart] = useState<T>(thisMonth);
  const [events, setEvents] = useState<TrainerEvent[]>([]);

  const monthTitle = useMemo(() => utils.format(monthStart, 'monthAndYear'), [monthStart, utils]);
  const monthStore = useMemo(() => utils.toJsDate(monthStart).getTime(), [monthStart, utils]);

  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId)!, [groups, selectedGroupId]);
  const activeMembers = useMemo(() => members.filter((m) => m.state === MemberState.ACCEPTED), [members]);

  const addMonth = useCallback((value) => setMonthStart((prev) => utils.addMonths(prev, value)), [utils]);

  const memberStats = useMemo<MemberStat[]>(() => {
    if (!selectedGroup) {
      return [];
    }
    const actEvents = events.filter((e) => e.groupId === selectedGroup.id ||
      (selectedGroup.attachedGroups && selectedGroup.attachedGroups.includes(e.groupId)));
    const stats = activeMembers.map((member) => {
      const memberStat = {
        member,
        stat: 0,
        allNo: actEvents.length,
      };
      actEvents.forEach((e) => {
        if (e.memberIds.includes(member.id)) {
          memberStat.stat += 1;
        }
      });
      return memberStat;
    });
    stats.sort((s1, s2) => s2.stat - s1.stat);
    return stats;
  }, [activeMembers, events, selectedGroup]);

  const addBonus = useCallback((member: MembershipType) => {
    showConfirmDialog({
      description: t('confirm.addUserBonus', { name: member.name }),
      okCallback: () => {
        const sheet = findOrCreateSheet(member, selectedGroup.groupType);
        sheet.remainingEventNo += 1;
        if (!member.bonuses) {
          member.bonuses = [];
        }
        member.bonuses.push(monthStore);
        updateMembership(member).then();
      },
    });
  }, [monthStore, selectedGroup?.groupType, showConfirmDialog, t, updateMembership]);

  useEffect(() => {
    const from = utils.toJsDate(monthStart);
    const now = utils.date(new Date())!;
    const to = utils.endOfMonth(monthStart);
    const xto = utils.isAfter(to, now) ? now : to;
    eventProvider.getEvents(from, utils.toJsDate(xto)).then((dbEvents) => setEvents(dbEvents));
  }, [eventProvider, monthStart, utils]);

  return (
    <>
      <Typography variant="h3">{t('trainer.userStats')}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <IconButton onClick={() => addMonth(-1)} color="primary"><ArrowBackIcon /></IconButton>
        <Chip color="primary" label={monthTitle}></Chip>
        <IconButton onClick={() => addMonth(1)} color="primary"><ArrowForwardIcon /></IconButton>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                    secondaryAction={
                      <IconButton onClick={() => addBonus(ms.member)} color="primary" disabled={ms.member.bonuses?.includes(monthStore)}>
                        <AddCircle />
                      </IconButton>
                    }
                    divider
          >
            <ListItemAvatar>
              <UserAvatar userId={ms.member.id} />
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: '10px' }}>
              <div>
                <Typography variant="subtitle1">{ms.member.name}</Typography>
                <TicketNoWarning sheet={findOrCreateSheet(ms.member, selectedGroup.groupType)!} t={t} />
              </div>
              <Chip color="primary" variant="outlined" label={ms.stat + '/' + ms.allNo}></Chip>
            </div>
          </ListItem>
        ))}
      </List>
    </>
  );
}