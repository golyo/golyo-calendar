import { Avatar, Chip, List, ListItem, ListItemAvatar, Typography } from '@mui/material';
import { TrainerContactMembership, useUser } from '../../hooks/user';
import UserMembershipDetailPopup from './UserMembershipDetailsPopup';
import { Event as EventIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import React, { useCallback } from 'react';
import { GroupType } from '../../hooks/trainer';

const UserMemberships = () => {
  const { groupMemberships, changeTrainerContactState, leaveGroup, cronConverter } = useUser();
  const { t } = useTranslation();

  const getRemainingNo = useCallback((membership: TrainerContactMembership, type: GroupType) =>
    membership.membership.ticketSheets.find((sheet) => sheet.type === type)?.remainingEventNo || 0, []);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.groups')}</Typography>
      <List>
        {groupMemberships && groupMemberships.map((groupMembership, idx) =>
          groupMembership.dbGroups.map((group, gidx) => (
            <ListItem key={`${idx}-${gidx}`}
                      secondaryAction={
                        <UserMembershipDetailPopup groupMembership={groupMembership}
                                                   group={group}
                                                   handleRequest={changeTrainerContactState}
                                                   leaveGroup={leaveGroup}
                                                   cronConverter={cronConverter} />
                      }
                      divider
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: group.color }}>
                  <EventIcon></EventIcon>
                </Avatar>
              </ListItemAvatar>
              <div className="horizontal" style={{ justifyContent: 'space-between', width: '100%', paddingRight: '10px' }}>
                <div>
                  <Typography variant="subtitle1">{groupMembership.trainer.trainerName}</Typography>
                  <Typography variant="subtitle2">
                    { group.name + ' - ' + t(`memberState.${groupMembership.membership.state}`)}
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle1">{t('membership.ticketNo')}</Typography>
                  <Typography variant="subtitle2">
                    <Chip label={getRemainingNo(groupMembership, group.groupType)}
                          color={getRemainingNo(groupMembership, group.groupType) > 0 ? 'primary' : 'error'} />
                  </Typography>
                </div>
              </div>
            </ListItem>
          )))}
      </List>
    </div>
  );
};

export default UserMemberships;
