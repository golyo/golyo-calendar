import { Avatar, Chip, IconButton, List, ListItem, ListItemAvatar, Typography } from '@mui/material';
import { TrainerContactMembership, useUser } from '../../hooks/user';
import UserMembershipDetailPopup from './UserMembershipDetailsPopup';
import { Event as EventIcon, Visibility } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useState } from 'react';
import { GroupType } from '../../hooks/trainer';
import { useParams } from 'react-router-dom';

const UserMemberships = () => {
  const { groupMemberships, changeTrainerContactState, leaveGroup, cronConverter } = useUser();
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();

  const [popupState, setPopupState] = useState<{ groupMembership?: TrainerContactMembership, groupId?: string }>({
    groupMembership: groupMemberships.find((grm) => grm.contactGroups.some((gr) => gr.id === groupId)),
    groupId: groupId,
  });

  const onSelect = useCallback((groupMembership: TrainerContactMembership, grId: string) => setPopupState({
    groupMembership,
    groupId: grId,
  }), []);

  const closePopup = useCallback(() => setPopupState({
    groupMembership: undefined,
    groupId: undefined,
  }), []);

  const getRemainingNo = useCallback((membership: TrainerContactMembership, type: GroupType) =>
    membership.membership.ticketSheets.find((sheet) => sheet.type === type)?.remainingEventNo || 0, []);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.groups')}</Typography>
      <List>
        {groupMemberships && groupMemberships.map((groupMembership, idx) =>
          groupMembership.contactGroups.map((group, gidx) => (
            <ListItem key={`${idx}-${gidx}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelect(groupMembership, group.id)}
                      secondaryAction={
                        <IconButton color="primary">
                          <Visibility />
                        </IconButton>
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
      <UserMembershipDetailPopup groupMembership={popupState.groupMembership}
                                 groupId={popupState.groupId}
                                 closeModal={closePopup}
                                 handleRequest={changeTrainerContactState}
                                 leaveGroup={leaveGroup}
                                 cronConverter={cronConverter}
      />
    </div>
  );
};

export default UserMemberships;
