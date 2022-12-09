/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useState, MouseEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import { useTheme } from '@emotion/react';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { MuiPickersAdapter } from '@mui/x-date-pickers/internals/models';

import { Breakpoints, useBreakpoint } from '../../hooks/breakpoint';
import { WeekTablePalette, WeekTheme } from '../../theme/weekTableTheme';
import { CalendarEvent, EventProvider } from '../../hooks/event';
import styles, { breakpointLineHeightMap } from './WeekView.style';
import { changeItem, removeItemById } from '../../hooks/firestore/firestore';
import { Check } from '@mui/icons-material';

export const WEEK_EVENT_CHANGED = 'weekEventChanged';
export enum WeekEventType {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  REMOVED = 'REMOVED',
}

const WEEK_ARRAY = Array.from(Array(7));

function getActualWeek<T>(utils: MuiPickersAdapter<T>, startDay: T) {
  return WEEK_ARRAY.map((e, i) =>
    utils.formatByString(utils.addDays(startDay, i), utils.formats.shortDate));
}

type HourEvent = {
  topPercent: number;
  heightPercent: number;
  event: CalendarEvent;
  color: string;
};

type DayEvents = {
  dayEvents: HourEvent[];
};

type WeekRow = {
  hour: string,
  weekEvents: DayEvents[];
};

const getHourString = (hour: number) => (hour).toString().padStart(2, '0') + ':00';

const getHourNo = (hourStr: string) => parseInt(hourStr.substring(0, 2));

const getStartHour = (rows: WeekRow[]) => rows.length > 0 ? getHourNo(rows[0].hour) - 1 : 0;

const generateDefaultsByMinMAx = (startHour: number, endHour: number) => {
  const rows: WeekRow[] = [];
  for (let i = startHour; i <= endHour - 1; i++) {
    rows.push({
      hour: getHourString(i + 1),
      weekEvents: WEEK_ARRAY.map(() => ({ dayEvents: [] })),
    });
  }
  return rows;
};

const MIN_HOUR_RANGE = {
  from: 11,
  to: 15,
};

const generateDefaults = (events: CalendarEvent[]) => {
  if (events.find((event) => event.startDate.getDay() !== event.endDate.getDay())) {
    return generateDefaultsByMinMAx(0, 24);
  }
  const minHourEvent = events.reduce((prev, curr) => prev.startDate.getHours() < curr.startDate.getHours() ? prev : curr);
  const maxHourEvent = events.reduce((prev, curr) => prev.endDate.getHours() > curr.endDate.getHours() ? prev : curr);
  const max = Math.min(maxHourEvent.endDate.getHours() + 1, 24);
  return generateDefaultsByMinMAx(Math.min(minHourEvent.startDate.getHours(), MIN_HOUR_RANGE.from), Math.max(max, MIN_HOUR_RANGE.to));
};

const minuteDiff = (event: CalendarEvent) => {
  if (event.startDate.getDay() !== event.endDate.getDay()) {
    return 24 * 60 - event.startDate.getHours() * 60 - event.startDate.getMinutes();
  } else {
    return 60 * (event.endDate.getHours() - event.startDate.getHours()) + (event.endDate.getMinutes() - event.startDate.getMinutes());
  }
};

const transformToHourEvent = (event: CalendarEvent, color: string) => {
  return {
    topPercent: (event.startDate.getMinutes() / 60),
    heightPercent: (minuteDiff(event) / 60),
    color,
    event,
  };
};

const appendEvent = (rows: WeekRow[], event: CalendarEvent, color: string, firstWeekDay: Date) => {
  const startHour = getStartHour(rows);
  const rowToAppend = rows[event.startDate.getHours() - startHour];
  const diff = event.startDate.getDay() - firstWeekDay.getDay();
  const colIdx = diff < 0 ? diff + 7 : diff;

  rowToAppend.weekEvents[colIdx].dayEvents.push(transformToHourEvent(event, color));
  return rows;
};

const convertToWeekView = (events: CalendarEvent[], weekPalette: WeekTablePalette, firstWeekDay: Date) => {
  if (events.length === 0) {
    return [];
  }
  const rows = generateDefaults(events);
  events.forEach((event, idx) => appendEvent(rows, event, event.color || weekPalette.eventColors[idx % weekPalette.eventColors.length], firstWeekDay));
  return rows;
};

type WeekViewProp<T> = {
  eventProvider: EventProvider;
  eventClick?: (event: CalendarEvent) => void;
  newEventClick?: (startDate: T) => void;
  weekLabel?: string;
  yearLabel?: string;
  todayLabel?: string;
};

export default function WeekView<T>({ eventProvider, eventClick, newEventClick, weekLabel = 'Week', yearLabel = 'Year', todayLabel = 'Today' } : WeekViewProp<T>) {
  const utils = useUtils<T>();
  const theme = useTheme() as WeekTheme;
  const { palette: { weekPalette } } = theme;
  const css = useMemo(() => styles(theme), [theme]);
  const breakpoint = useBreakpoint();
  const [firstWeekDay, setFirstWeekDay] = useState<T>(utils.startOfWeek(utils.date()!));
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const weekDays = useMemo(() => utils.getWeekdays(), [utils]);
  const dayHeaders = useMemo(() => getActualWeek(utils, firstWeekDay), [utils, firstWeekDay]);
  const year = useMemo(() => utils.getYear(firstWeekDay), [utils, firstWeekDay]);

  const goPrevYear = useCallback(() => setFirstWeekDay((prev: any) => utils.startOfWeek(utils.addMonths(prev, -12))), [utils]);
  const goPrevWeek = useCallback(() => setFirstWeekDay((prev: any) => utils.addDays(prev, -7)), [utils]);
  const goToday = useCallback(() => setFirstWeekDay(utils.startOfWeek(utils.date()!)), [utils]);
  const goNextWeek = useCallback(() => setFirstWeekDay((prev: any) => utils.addDays(prev, 7)), [utils]);
  const goNextYear = useCallback(() => setFirstWeekDay((prev: any) => utils.startOfWeek(utils.addMonths(prev, 12))), [utils]);

  const lastWeekDay = useMemo(() => utils.endOfDay(utils.addDays(firstWeekDay, 6)) as any, [firstWeekDay, utils]);

  const todayInrange = useMemo(() => {
    const now = utils.date()!;
    return !utils.isAfter(firstWeekDay, now) && !utils.isBefore(lastWeekDay, now);
  }, [firstWeekDay, lastWeekDay, utils]);

  const handleEventChanged = useCallback((e: any) => {
    const { detail : { changedEvent, type } } = e;
    setEvents((prev) => {
      switch (type) {
        case WeekEventType.ADDED: {
          const toArray = changeItem(prev, changedEvent);
          toArray.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
          return toArray;
        }
        case WeekEventType.REMOVED: {
          return removeItemById(prev, changedEvent.id);
        }
        default: {
          return changeItem(prev, changedEvent);
        }
      }
    });
  }, []);

  const tableRows = useMemo(() => convertToWeekView(events, weekPalette, utils.toJsDate(firstWeekDay)), [events, firstWeekDay, utils, weekPalette]);

  const lineHeight: number = useMemo(() => breakpointLineHeightMap[breakpoint as keyof Record<Breakpoints, number>], [breakpoint]);

  const onTableCellClicked = useCallback((event: MouseEvent, rowIdx: number, cellIdx: number) => {
    if (newEventClick && (event!.target! as HTMLElement).tagName === 'TD') {
      const startDate = utils.setHours(utils.addDays(firstWeekDay, cellIdx), parseInt(tableRows[rowIdx].hour) - 1);
      newEventClick(startDate);
    }
  }, [firstWeekDay, newEventClick, tableRows, utils]);

  useEffect(() => {
    window.addEventListener(WEEK_EVENT_CHANGED, handleEventChanged);
    return () => {
      window.removeEventListener(WEEK_EVENT_CHANGED, handleEventChanged);
    };
  }, [handleEventChanged]);

  useEffect(() => {
    if (!eventProvider) {
      return;
    }
    // if language changed, utils changed, and firstWeekDay could changed
    const firstDay = utils.startOfWeek(utils.addDays(firstWeekDay, 1));
    if (!utils.isSameDay(firstWeekDay, firstDay)) {
      // effect will triggered after firstWeekDayChanged
      setFirstWeekDay(firstDay);
      return;
    }
    // load events
    const endDay = utils.endOfDay(utils.addDays(firstWeekDay, 6));
    eventProvider.getEvents(utils.toJsDate(firstWeekDay), utils.toJsDate(endDay)).then((result) => setEvents(result));
  },  [eventProvider, firstWeekDay, utils]);

  return (
    <TableContainer css={css.root}>
      <Table aria-label="collapsible table" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '40px' }}/>
          <col/>
          <col/>
          <col/>
          <col/>
          <col/>
          <col/>
          <col/>
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell colSpan={8} css={css.weekCell}>
              <div css={css.headerNavigation}>
                <div>
                  <span css={css.headerLabel}>{weekLabel}</span>
                  <IconButton onClick={goPrevWeek} size="small" color="success"><ArrowBackIcon /></IconButton>
                  <Button onClick={goToday}
                          variant="contained"
                          color={todayInrange ? 'inherit' : 'success'}
                          disabled={todayInrange}
                          size="small">
                    {todayLabel}
                  </Button>
                  <IconButton onClick={goNextWeek} size="small" color="success"><ArrowForwardIcon /></IconButton>
                </div>
                <div>
                  <span css={css.headerLabel}>{yearLabel}</span>
                  <IconButton onClick={goPrevYear} size="small" color="success"><ArrowBackIcon /></IconButton>
                  <Chip label={ year } color="primary" size="small" />
                  <IconButton onClick={goNextYear} size="small" color="success"><ArrowForwardIcon /></IconButton>
                </div>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell css={css.weekCell}>
              <div css={css.chipContent}>
                <Chip label={ getHourString(getStartHour(tableRows)) } css={css.timeChip} size="small" />
              </div>
            </TableCell>
            { dayHeaders.map((weekDay, i) => (
              <TableCell key={i} css={css.weekCell}>
                <div css={css.headerContent}>
                  <div>{weekDay}</div>
                  <div>{weekDays[i]} </div>
                </div>
              </TableCell>
            )) }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows.map((row, i) => (
            <TableRow key={i}>
              <TableCell css={css.weekCell}>
                <div css={css.chipContent}>
                  <Chip label={row.hour} css={css.timeChip} size="small" />
                </div>
              </TableCell>
              { row.weekEvents.map((weekEvent, j) => (
                <TableCell key={i + '-' + j} css={css.weekCell} onClick={(e) => onTableCellClicked(e, i, j)}>
                  { weekEvent && weekEvent.dayEvents.map((hourEvent, k) => (
                    <div css={css.eventContent} key={i + '-' + j + '-' + k} style={{
                      top: hourEvent.topPercent * lineHeight,
                      height: hourEvent.heightPercent * lineHeight - 4,
                      backgroundColor: hourEvent.color,
                    }} onClick={() => eventClick ? eventClick(hourEvent.event) : null}>
                      { hourEvent.event.text }
                      {hourEvent.event.checked && <Check css={css.checkBadge} color="primary"/>}
                      {hourEvent.event.badge && <Chip
                        css={css.eventBadge}
                        size="small"
                        label={hourEvent.event.isDeleted ? 'X' : hourEvent.event.badge}
                        color={hourEvent.event.isDeleted ? 'error' : 'primary'}
                      />}
                    </div>
                  )) }
                </TableCell>
              )) }
            </TableRow>
          )) }
        </TableBody>
      </Table>
    </TableContainer>
  );
}
