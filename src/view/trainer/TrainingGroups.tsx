import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Box, Button, Divider, IconButton, List, ListItem, ListItemAvatar, Typography,
} from '@mui/material';
import {
  AddCircle,
  Edit, Event as EventIcon,
} from '@mui/icons-material';
import { useUser } from '../../hooks/user';
import { TrainingGroupUIType } from '../../hooks/trainer';
import { Link } from 'react-router-dom';
import EditGroupPopup from './group/EditGroupPopup';
import { convertGroupToUi, DEFAULT_GROUP, useTrainer } from '../../hooks/trainer';

const TrainingGroups = () => {
  const { t } = useTranslation();
  const { user, cronConverter } = useUser();
  const { groups, saveGroup } = useTrainer();

  const traningUiGroups = useMemo(() => groups.map((group) => convertGroupToUi(group, cronConverter)), [groups, cronConverter]);
  const [edit, setEdit] = useState<boolean>(false);

  const closePopup = useCallback(() => setEdit(false), []);
  const openPopup = useCallback(() => setEdit(true), []);

  const saveEvent = useCallback((modified: TrainingGroupUIType) => {
    return saveGroup(modified).then(() => {
      closePopup();
    });
  }, [saveGroup, closePopup]);

  const doMove = useCallback(() => {
    throw new Error('Alma');
  }, []);

  if (!user) {
    console.log('XXXXtestEMail', doMove);
    return null;
  }

  return (
    <div className="vertical">
      <Typography variant="h3">{t('trainer.groups')}</Typography>
      <List sx={{ width: 'max(70vw, 320px)', bgcolor: 'background.paper', borderColor: 'divider' }}>
        {traningUiGroups.map((group, idx) => (
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
                  <IconButton component={Link} to={`/group/${group.id}`}>
                    <Edit></Edit>
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
            <Divider variant="inset" component="li" />
          </div>
        ))}
      </List>
      <div><Button onClick={openPopup} variant="contained" startIcon={<AddCircle />}>{t('trainer.newGroup')}</Button></div>
      <EditGroupPopup trainingGroup={{ ...DEFAULT_GROUP }} closePopup={closePopup} isOpen={edit} saveGroup={saveEvent} />
    </div>
  );
};

export default TrainingGroups;