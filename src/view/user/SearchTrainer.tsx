import React, { useEffect, useState } from 'react';
import { Avatar, Divider, List, ListItem, ListItemAvatar, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { User, useUser } from '../../hooks/user';
import SearchGroupPopup from './SearchGroupPopup';

export default function SearchTrainer() {
  const { t } = useTranslation();
  const { loadTrainers } = useUser();
  const [trainers, setTrainers] = useState<User[]>([]);

  useEffect(() => {
    loadTrainers().then((dbTrainers) => setTrainers(dbTrainers));
  }, [loadTrainers]);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('menu.searchTrainer')}</Typography>
      <List>
        <Divider />
        {trainers.map((trainer, idx) => (
          <ListItem key={idx}
                    secondaryAction={<SearchGroupPopup trainer={trainer} />}
                    divider
          >
            <ListItemAvatar>
              <Avatar src={trainer.photoURL} />
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div>
                <Typography variant="subtitle1">{trainer.name}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2">{ trainer.location }</Typography>
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
}