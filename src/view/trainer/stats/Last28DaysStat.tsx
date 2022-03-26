import React, { useMemo } from 'react';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MemberEventStat from './MemberEventStat';

export default function Last28DaysStat<T>() {
  const utils = useUtils<T>();
  const { t } = useTranslation();

  const interval = useMemo(() => ({
    from: utils.toJsDate(utils.addDays(utils.date(new Date())!, -28)),
    to: new Date(),
  }), [utils]);

  return (
    <>
      <Typography variant="h3">{t('trainer.last28DaysStats')}</Typography>
      <MemberEventStat interval={interval} />
    </>
  );
}