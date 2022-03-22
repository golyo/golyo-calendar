import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { findOrCreateSheet, GroupType, MembershipType, MemberState, useTrainer } from '../../../hooks/trainer';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { TrainerEvent } from '../../../hooks/event';
import {
  Box, Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AddCircle } from '@mui/icons-material';
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

const STATES = Object.values(GroupType) as GroupType[];

export default function MemberEventStat<T>() {
  const utils = useUtils<T>();
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();
  const { eventProvider, members, groups, updateMembership } = useTrainer();

  const [selectedType, setSelectedType] = useState<GroupType>(GroupType.GROUP);

  const thisMonth = useMemo(() => utils.startOfMonth(utils.date(new Date())!), [utils]);

  const [monthStart, setMonthStart] = useState<T>(thisMonth);
  const [events, setEvents] = useState<TrainerEvent[]>([]);

  const monthTitle = useMemo(() => utils.format(monthStart, 'monthAndYear'), [monthStart, utils]);

  const attachedGroupMap = useMemo(() => {
    const map = {} as Record<string, string[]>;
    groups.forEach((g) => {
      if (g.attachedGroups && g.attachedGroups.length > 0) {
        map[g.id] = g.attachedGroups;
      }
    });
    return map;
  }, [groups]);
  
  const addMonth = useCallback((value) => setMonthStart((prev) => utils.addMonths(prev, value)), [utils]);

  const memberStats = useMemo<MemberStat[]>(() => {
    const actEvents = events.filter((e) => groups.find((g) => g.id === e.groupId)?.groupType === selectedType);

    const stats = members.filter((m) => m.state === MemberState.ACCEPTED).map((member) => {
      const memberStat = {
        member,
        stat: 0,
        allNo: 0,
      };
      actEvents.forEach((e) => {
        if (e.memberIds.includes(member.id)) {
          memberStat.stat += 1;
        }
        if (member.groups.some((grId) => (grId === e.groupId ||
          (attachedGroupMap[grId] && attachedGroupMap[grId].includes(e.groupId))))) {
          memberStat.allNo += 1;
        }
      });
      return memberStat;
    });
    stats.sort((s1, s2) => s2.stat - s1.stat);
    return stats;
  }, [attachedGroupMap, events, groups, members, selectedType]);

  const addBonus = useCallback((member: MembershipType) => {
    showConfirmDialog({
      description: t('confirm.addUserBonus', { name: member.name }),
      okCallback: () => {
        const sheet = findOrCreateSheet(member, selectedType);
        sheet.remainingEventNo += 1;
        updateMembership(member).then();
      },
    });
  }, [selectedType, showConfirmDialog, t, updateMembership]);

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
                   onChange={(e) => setSelectedType(e.target.value as GroupType)}
                   value={selectedType}
                   label={t('common.filter')}
                   size="small"
                   variant="standard"
                   sx={{ minWidth: '200px' }}
        >
          { STATES.map((state, idx) => <MenuItem key={idx} value={state}>{t(`groupType.${state}`)}</MenuItem>)}
        </TextField>
      </Box>
      <List>
        <Divider />
        {memberStats.map((ms, idx) => (
          <ListItem key={idx}
                    secondaryAction={<IconButton onClick={() => addBonus(ms.member)} color="primary"><AddCircle /></IconButton>}
                    divider
          >
            <ListItemAvatar>
              <UserAvatar userId={ms.member.id} />
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: '10px' }}>
              <div>
                <Typography variant="subtitle1">{ms.member.name}</Typography>
                <TicketNoWarning sheet={findOrCreateSheet(ms.member, selectedType)!} t={t} />
              </div>
              <Chip color="primary" variant="outlined" label={ms.stat + '/' + ms.allNo}></Chip>
            </div>
          </ListItem>
        ))}
      </List>
    </>
  );
}