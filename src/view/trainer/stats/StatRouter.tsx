import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs } from '@mui/material';

import React, { useMemo } from 'react';

const StatRouter = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const value = useMemo(() => {
    if (location.pathname.endsWith('monthlyStat')) {
      return 1;
    } else if (location.pathname.endsWith('ticketStat')) {
      return 2;
    } else {
      return 0;
    }
  }, [location]);

  return (
    <div className="vertical">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value}>
          <Tab component={Link} to="" label={t('menu.last28DaysStats')} />
          <Tab component={Link} to="monthlyStat" label={t('menu.userMonthlyStats')} />
          <Tab component={Link} to="ticketStat" label={t('menu.memberTicketStats')} />
        </Tabs>
      </Box>
      <Outlet />
    </div>
  );
};

export default StatRouter;