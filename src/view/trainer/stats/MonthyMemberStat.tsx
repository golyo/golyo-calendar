import React, { useCallback, useMemo, useState } from 'react';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';
import {
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MemberEventStat from './MemberEventStat';

export default function MonthlyMemberStat<T>() {
  const utils = useUtils<T>();
  const { t } = useTranslation();

  const thisMonth = useMemo(() => utils.startOfMonth(utils.date(new Date())!), [utils]);

  const [monthStart, setMonthStart] = useState<T>(thisMonth);

  const monthTitle = useMemo(() => utils.format(monthStart, 'monthAndYear'), [monthStart, utils]);

  const addMonth = useCallback((value: number) => setMonthStart((prev) => utils.addMonths(prev, value)), [utils]);

  const toDate = useMemo(() => utils.toJsDate(utils.endOfMonth(monthStart)), [monthStart, utils]);

  const interval = useMemo(() => {
    const now = new Date();
    return {
      from: utils.toJsDate(monthStart),
      to: now < toDate ? now : toDate,
    };
  }, [monthStart, toDate, utils]);

  return (
    <>
      <Typography variant="h3">{t('trainer.userMonthlyStats')}</Typography>
      <MemberEventStat interval={interval} leftFilter={(
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <IconButton onClick={() => addMonth(-1)} color="primary"><ArrowBackIcon /></IconButton>
          <Chip color="primary" label={monthTitle}></Chip>
          <IconButton onClick={() => addMonth(1)} color="primary" disabled={new Date() < toDate}><ArrowForwardIcon /></IconButton>
        </Box>
      )} />
    </>
  );
}