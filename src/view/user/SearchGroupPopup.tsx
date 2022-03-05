import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Divider, IconButton, List, ListItem, ListItemAvatar, Modal, Typography } from '@mui/material';
import { AddCircle, Event as EventIcon, Visibility } from '@mui/icons-material';
import { User, useUser } from '../../hooks/user';
import ModalContainer from '../common/ModalContainer';
import ModalTitle from '../common/ModalTitle';
import {
  convertGroupToUi,
  TrainingGroupUIType,
  TrainingGroupType,
  MembershipType,
  DEFAULT_MEMBER,
} from '../../hooks/trainer';
import { insertObject, useFirestore } from '../../hooks/firestore/firestore';
import { useDialog } from '../../hooks/dialog';
import { useFirebase } from '../../hooks/firebase';

interface Props {
  trainer: User;
}

const SearchGroupPopup = ({ trainer }: Props) => {
  const { t } = useTranslation();
  const groupService = useFirestore<TrainingGroupType>(`users/${trainer.id}/groups`);
  const { showConfirmDialog, showDialog } = useDialog();
  const { firestore } = useFirebase();

  const { user, cronConverter, addGroupMembership } = useUser();

  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<TrainingGroupUIType[]>([]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const addUserRequest = useCallback((group: TrainingGroupUIType) => {
    const membership: MembershipType = {
      ...DEFAULT_MEMBER,
      name: user!.name,
      id: user!.id,
    };
    return insertObject(firestore, `users/${trainer.id}/groups/${group.id}/members`, membership);
  }, [firestore, trainer.id, user]);

  const joinToGroup = useCallback((group: TrainingGroupUIType) => {
    if (user!.id === trainer.id) {
      showDialog({
        title: 'common.warning',
        description: 'warning.trainerOwnGroup',
      });
      return;
    }
    if (user!.memberships && user!.memberships.some((member) => member.groupId === group.id)) {
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
        addGroupMembership(trainer, group.id).then(() => {
          addUserRequest(group);
          closeModal();
        });
      },
    });
  }, [addGroupMembership, addUserRequest, closeModal, showConfirmDialog, showDialog, t, trainer, user]);

  useEffect(() => {
    groupService.listAll().then(
      (dbGroups) => setGroups(dbGroups.map((group) => convertGroupToUi(group, cronConverter))));
  }, [cronConverter, groupService, trainer.id]);
  return (
    <>
      <IconButton onClick={openModal}>
        <Visibility />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big">
          <ModalTitle close={closeModal}>{ trainer.name }</ModalTitle>
          {t('common.yes')}
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
    </>
  );
};

export default SearchGroupPopup;