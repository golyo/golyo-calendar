import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { findOrCreateSheet, MembershipType, MemberState, useTrainer } from '../../../hooks/trainer';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';
import { TrainerEvent } from '../../../hooks/event';
import {
  Alert,
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
import { useDialog } from '../../../hooks/dialog';
import UserAvatar from '../../common/UserAvatar';

interface MemberStat {
  member: MembershipType;
  inrangeBonus?: Date;
  stat: number;
  bonusStat: number;
  allNo: number;
}

export interface Interval {
  from: Date;
  to: Date;
}

export interface StatProp {
  interval: Interval,
  leftFilter?: React.ReactNode,
}

const findInrangeBonus = (member: MembershipType, interval: Interval) => {
  if (!member.bonuses) {
    return undefined;
  }
  for (let i = member.bonuses.length - 1; i >= 0; i--) {
    const d = new Date(member.bonuses[i]);
    if (interval.from <= d && d <= interval.to) {
      return d;
    }
  }
  return undefined;
};

export default function MemberEventStat<T>({ interval, leftFilter } : StatProp) {
  const utils = useUtils<T>();
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();
  const { eventProvider, members, groups, updateMembership } = useTrainer();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const [events, setEvents] = useState<TrainerEvent[]>([]);

  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId)!, [groups, selectedGroupId]);
  const activeMembers = useMemo(() => members.filter((m) => m.state === MemberState.ACCEPTED), [members]);

  const memberStats = useMemo<MemberStat[]>(() => {
    if (!selectedGroup) {
      return [];
    }
    const actEvents = events.filter((e) => e.groupId === selectedGroup.id ||
      (selectedGroup.attachedGroups && selectedGroup.attachedGroups.includes(e.groupId)));
    const stats = activeMembers.filter((m) => m.groups.some((gid) => gid === selectedGroup.id ||
      (selectedGroup.attachedGroups && selectedGroup.attachedGroups.includes(gid)))).map((member) => {
      const inrangeBonus = findInrangeBonus(member, interval);
      const memberStat = {
        member,
        inrangeBonus,
        stat: 0,
        bonusStat: 0,
        allNo: actEvents.length,
      };
      actEvents.forEach((e) => {
        if (e.memberIds.includes(member.id)) {
          memberStat.stat += 1;
          if (inrangeBonus && inrangeBonus < e.startDate) {
            memberStat.bonusStat += 1;
          }
        }
      });
      return memberStat;
    });
    stats.sort((s1, s2) => s2.stat - s1.stat);
    return stats;
  }, [activeMembers, events, interval, selectedGroup]);

  const onAddBonus = useCallback((member: MembershipType) => {
    showConfirmDialog({
      description: t('confirm.addUserBonus', { name: member.name }),
      okCallback: () => {
        const sheet = findOrCreateSheet(member, selectedGroup.groupType);
        sheet.remainingEventNo += 1;
        if (!member.bonuses) {
          member.bonuses = [];
        }
        member.bonuses.push(utils.toJsDate(utils.startOfDay(utils.date(new Date())!)).getTime());
        updateMembership(member).then();
      },
    });
  }, [selectedGroup, showConfirmDialog, t, updateMembership, utils]);

  const bonusInfo = useCallback((memberStat: MemberStat) => {
    if (!memberStat.inrangeBonus) {
      return null;
    }
    return (
      <Alert variant="outlined" severity="info">
        {t('trainer.bonusTime') + ': ' + utils.format(utils.date(memberStat.inrangeBonus)!, 'shortDate')}
      </Alert>
    );
  }, [t, utils]);

  const ticketInfo = useCallback((ms: MemberStat) => {
    const prefix = ms.inrangeBonus ? ms.bonusStat + '/' : '';
    return prefix + ms.stat + '/' + ms.allNo;
  }, []);

  useEffect(() => {
    eventProvider.getEvents(interval.from, interval.to).then((dbEvents) => setEvents(dbEvents));
  }, [eventProvider, interval, utils]);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{leftFilter}</div>
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
                      <IconButton onClick={() => onAddBonus(ms.member)} color="primary" >
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
                {bonusInfo(ms)}
              </div>
              <Chip color={ms.inrangeBonus ? 'error' : 'primary'}  variant="outlined" label={ticketInfo(ms)}></Chip>
            </div>
          </ListItem>
        ))}
      </List>
    </>
  );
}