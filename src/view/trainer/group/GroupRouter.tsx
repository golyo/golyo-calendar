import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { ArrowBack, Event as EventIcon } from '@mui/icons-material';

import { GroupProvider, useGroup } from '../../../hooks/trainer';
import React, { useMemo } from 'react';

const GroupContextHeader = () => {
  const { group } = useGroup();
  const { t } = useTranslation();

  if (!group) {
    return null;
  }
  return (
    <Typography variant="h3" className="horizontal">
      <IconButton component={Link} to="/groups">
        <ArrowBack color="primary"/>
      </IconButton>
      <Avatar sx={{ bgcolor: group.color }}>
        <EventIcon></EventIcon>
      </Avatar>
      {t('trainingGroup.displayTitle', { name: group.name })}
    </Typography>
  );
};

const matchIdxs = [/\/members$/, /(\/events|\/event\/\d{6,})$/];

const GroupRouter = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useTranslation();
  const location = useLocation();

  const value = useMemo(() => matchIdxs.findIndex((regexp) => location.pathname.match(regexp)) + 1, [location]);

  if (!groupId) {
    return null;
  }
  return (
    <GroupProvider groupId={groupId}>
      <div className="vertical">
        <GroupContextHeader />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value}>
            <Tab component={Link} to="" label={t('trainingGroup.baseData')} />
            <Tab component={Link} to="members" label={t('trainingGroup.members')} />
            <Tab component={Link} to="events" label={t('trainer.events')} />
          </Tabs>
        </Box>
        <Outlet />
      </div>
    </GroupProvider>
  );
};

export default GroupRouter;