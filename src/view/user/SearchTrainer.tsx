import React, { useCallback, useEffect, useState } from 'react';
import { Divider, IconButton, List, ListItem, ListItemAvatar, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { User, useUser } from '../../hooks/user';
import SearchGroupPopup from './SearchGroupPopup';
import { Visibility } from '@mui/icons-material';
import UserAvatar from '../common/UserAvatar';

export default function SearchTrainer() {
  const { t } = useTranslation();
  const { loadTrainers } = useUser();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [trainer, setTrainer] = useState<User>();

  useEffect(() => {
    loadTrainers().then((dbTrainers) => setTrainers(dbTrainers));
  }, [loadTrainers]);

  const closeModal = useCallback(() => setTrainer(undefined), []);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('menu.searchTrainer')}</Typography>
      <List>
        <Divider />
        {trainers.map((tr, idx) => (
          <ListItem key={idx}
                    onClick={() => setTrainer(tr)}
                    style={{ cursor: 'pointer' }}
                    secondaryAction={
                      <IconButton color="primary">
                        <Visibility />
                      </IconButton>
                    }
                    divider
          >
            <ListItemAvatar>
              <UserAvatar userId={tr.id}></UserAvatar>
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div>
                <Typography variant="subtitle1">{tr.name}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2">{ tr.location }</Typography>
              </div>
            </div>
          </ListItem>
        ))}
      </List>
      <SearchGroupPopup trainer={trainer} closeModal={closeModal}/>
    </div>
  );
}