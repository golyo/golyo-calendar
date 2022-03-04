import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

import { useUser } from '../../hooks/user';
import { TrainerEvent } from '../../hooks/event';
import EventPopup from '../calendar/EventPopup';
import WeekView from '../calendar/WeekView';

export default function UserCalendar() {
  const { t } = useTranslation();
  const { userEventProvider } = useUser();
  const [selectedEvent, setSelectedEvent] = useState<TrainerEvent | null>(null);

  const eventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const resetEvent = useCallback(() => setSelectedEvent(null), []);

  return (
    <div className="vertical">
      <Typography variant="h3">{t('menu.myCalendar')}</Typography>
      <WeekView eventClick={eventClick}
                eventProvider={userEventProvider}
                todayLabel={t('calendar.actWeek')}
                weekLabel={t('calendar.week')}
                yearLabel={t('calendar.year')}
      />
      <EventPopup event={selectedEvent} resetEvent={resetEvent} />
    </div>
  );
}
