import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Divider, IconButton, List, ListItem, ListItemAvatar, Modal, Typography } from '@mui/material';
import { AddCircle, Event as EventIcon } from '@mui/icons-material';
import { User, useUser } from '../../hooks/user';
import ModalContainer from '../common/ModalContainer';
import {
  convertGroupToUi,
  TrainingGroupType,
  TrainingGroupUIType,
} from '../../hooks/trainer';
import { useDialog } from '../../hooks/dialog';
import { useFirestore } from '../../hooks/firestore/firestore';

interface Props {
  trainer?: User;
  closeModal: () => void;
}

const SearchGroupPopup = ({ trainer, closeModal }: Props) => {
  const { t } = useTranslation();
  const groupService = useFirestore<TrainingGroupType>(`trainers/${trainer?.id}/groups`);
  const { showConfirmDialog, showDialog } = useDialog();

  const { user, cronConverter, addGroupMembership } = useUser();

  const [groups, setGroups] = useState<TrainingGroupUIType[]>([]);

  const joinToGroup = useCallback((group: TrainingGroupUIType) => {
    if (user!.id === trainer!.id) {
      showDialog({
        title: 'common.warning',
        description: 'warning.trainerOwnGroup',
      });
      return;
    }
    if (user!.memberships && user!.memberships.some((member) => member.trainerId === trainer!.id)) {
      showDialog({
        title: 'common.warning',
        description: 'warning.membershipExists',
      });
      return;
    }
    if (group.inviteOnly) {
      showDialog({
        title: 'common.warning',
        description: 'warning.groupInviteOnly',
      });
      return;
    }
    showConfirmDialog({
      description: t('confirm.userRequest'),
      okCallback: () => {
        addGroupMembership(trainer!, group).then(() => {
          closeModal();
        });
      },
    });
  }, [addGroupMembership, closeModal, showConfirmDialog, showDialog, t, trainer, user]);

  useEffect(() => {
    if (!trainer) {
      return setGroups([]);
    }
    groupService.listAll().then(
      (dbGroups) => setGroups(dbGroups.map((group) => convertGroupToUi(group, cronConverter))));
  }, [cronConverter, groupService, trainer]);

  if (!trainer) {
    return null;
  }
  return (
    <Modal
      open={!!trainer}
      onClose={closeModal}
    >
      <ModalContainer variant="big" close={closeModal} title={trainer?.name}>
        <Typography variant="h5">{t('trainer.groups')}</Typography>
        <List sx={{ width: 'max(70vw, 320px)', bgcolor: 'background.paper', borderColor: 'divider' }}>
          {groups.map((group, idx) => (
            <div key={idx}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: group.color }}>
                    <EventIcon></EventIcon>
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography color="inherit" sx={{ flex: 1, width: '50%' }}>{ group.name }</Typography>
                  <Box sx={{ width: '50%' }}>
                    {group.crons.map((cron, gidx) => (
                      <div key={`${idx}-${gidx}`}>{cron.days.join(',')}&nbsp;&nbsp;{cron.time}</div>
                    ))}
                  </Box>
                  <Box sx={{ width: '40px' }}>
                    <IconButton onClick={() => joinToGroup(group)}>
                      <AddCircle></AddCircle>
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
              <Divider variant="inset" component="li" />
            </div>
          ))}
        </List>
      </ModalContainer>
    </Modal>
  );
};

export default SearchGroupPopup;