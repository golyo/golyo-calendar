import { UiCronType } from './UserContext';
import { MuiPickersAdapter } from '@mui/x-date-pickers/internals/models';

const daysToWeekValue = (days: string[], weekDays: string[]) => days.map((dayIdx) => weekDays[parseInt(dayIdx)]);
const daysToWeekIdx = (days: string[], weekDays: string[]) => days.map((dayName) => weekDays.indexOf(dayName));

const CRON_CONVERTER = {
  toCron: (uiCron: UiCronType, weekDays: string[]) => {
    const days = daysToWeekIdx(uiCron.days, weekDays);
    const time = uiCron.time.split(':');
    const cron = `${time[1]} ${time[0]} * * ${days.join(',')}`;
    return cron;
  },
  toUiCron: (cron: string, weekDays: string[]) => {
    const cronItems = cron.split(' ');
    const uiCron = {
      days: daysToWeekValue(cronItems[4].split(','), weekDays),
      time: cronItems[1] + ':' + cronItems[0],
    };
    return uiCron;
  },
};

export const createCronConverter = <T>(utils: MuiPickersAdapter<T>) => {
  const weekDays = utils.getWeekdays();
  if (utils.locale?.options?.weekStartsOn === 1) {
    weekDays.unshift(weekDays.pop()!);
  }
  return {
    toCron: (uiCron: UiCronType) => CRON_CONVERTER.toCron(uiCron, weekDays),
    toUiCron: (cron: string) => CRON_CONVERTER.toUiCron(cron, weekDays),
  };
};