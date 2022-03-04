import { Avatar, Chip, List, ListItem, ListItemAvatar, Typography } from '@mui/material';
import { useUser } from '../../hooks/user';
import UserMembershipDetailPopup from './UserMembershipDetailsPopup';
import { Event as EventIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import React from 'react';

const UserMemberships = () => {
  const { groupMemberships, changeUserGroupState, cronConverter } = useUser();
  const { t } = useTranslation();

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.groups')}</Typography>
      <List>
        {groupMemberships && groupMemberships.map((groupMembership, idx) => (
          <ListItem key={idx}
                    secondaryAction={
                      <UserMembershipDetailPopup groupMembership={groupMembership} handleRequest={changeUserGroupState} cronConverter={cronConverter} />
                    }
                    divider
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: groupMembership.group.color }}>
                <EventIcon></EventIcon>
              </Avatar>
            </ListItemAvatar>
            <div className="horizontal" style={{ justifyContent: 'space-between', width: '100%', paddingRight: '10px' }}>
              <div>
                <Typography variant="subtitle1">{groupMembership.trainerName}</Typography>
                <Typography variant="subtitle2">
                  { groupMembership.group.name + ' - ' + t(`memberState.${groupMembership.membership.state}`)}
                </Typography>
              </div>
              <div>
                <Typography variant="subtitle1">{t('membership.ticketNo')}</Typography>
                <Typography variant="subtitle2">
                  <Chip label={groupMembership.membership.remainingEventNo}
                        color={groupMembership.membership.remainingEventNo > 0 ? 'primary' : 'error'} />
                </Typography>
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default UserMemberships;
