import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

import { TrainerEvent } from '../../../hooks/event';
import WeekView from '../../calendar/WeekView';
import EventPopup from '../../calendar/EventPopup';
import { useTrainer } from '../../../hooks/trainer';

export default function TrainerCalendar() {
  const { t } = useTranslation();
  const { eventProvider } = useTrainer();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<TrainerEvent | null>(null);

  const eventClick = useCallback((event) => {
    navigate(`/group/${event.groupId}/event/${event.id}`);
  }, [navigate]);

  const resetEvent = useCallback(() => setSelectedEvent(null), []);

  useEffect(() => eventProvider.setGroupRestriction(undefined), [eventProvider]);

  return (
    <div>
      <Typography variant="h3">{t('trainer.calendar')}</Typography>
      <WeekView eventClick={eventClick}
                eventProvider={eventProvider}
                todayLabel={t('calendar.actWeek')}
                weekLabel={t('calendar.week')}
                yearLabel={t('calendar.year')}
      />
      <EventPopup event={selectedEvent} resetEvent={resetEvent} />
    </div>
  );
}
