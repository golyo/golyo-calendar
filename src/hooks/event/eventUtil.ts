import parser, { CronDate } from 'cron-parser';
import { User, TrainerContactMembership, TrainerGroups } from '../../hooks/user';
import { CalendarEvent, EventProvider, TrainerEvent } from './EventContext';
import { TrainerContact } from '../user/UserContext';
import { Firestore, getDoc, doc, where, setDoc } from 'firebase/firestore';
import { doQuery, getCollectionRef } from '../firestore/firestore';
import { TrainingGroupType, findOrCreateSheet } from '../trainer';

const NEXT_EVENT_DAYNO = 28;
const NEXT_EVENTS_RANGE = NEXT_EVENT_DAYNO * 24 * 60 * 60 * 1000;

const EVENT_COMPARE = (event1: CalendarEvent, event2: CalendarEvent) => event1.startDate.getTime() - event2.startDate.getTime();

export const getNextEventTo = () => new Date(Date.now() + NEXT_EVENTS_RANGE);
export const getNextEventFrom = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

const getCronInterval = (cronStr: string, from: Date, to: Date) => {
  var options = {
    currentDate: from,
    endDate: to,
    iterator: true,
  };
  return parser.parseExpression(cronStr, options);
};

export const generateCronEvent = (group: TrainingGroupType, trainer: TrainerContact, startDate: Date) => {
  return {
    id: startDate.getTime().toString(),
    isDeleted: false,
    groupId: group.id,
    trainerId: trainer.trainerId,
    title: trainer.trainerName,
    text: group.name,
    startDate: startDate,
    endDate: new Date(startDate.getTime() + (group.duration * 60 * 1000)),
    color: group.color,
    memberIds: [],
  } as TrainerEvent;
};

const appendCronEvents = (events: TrainerEvent[], group:TrainingGroupType, trainer: TrainerContact, from: Date, to: Date) => {
  group.crons.forEach((cron) => {
    const interval = getCronInterval(cron, from, to);
    while (interval.hasNext()) {
      const aa = interval.next() as IteratorReturnResult<CronDate>;
      const eventDate = aa.value.toDate();
      if (!events.some((event) => event.startDate.getTime() === eventDate.getTime())) {
        events.push(generateCronEvent(group, trainer, eventDate));
      }
    }
  });
};

const getHour = (date: Date) => date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');

export const getInterval = (event: CalendarEvent) => getHour(event.startDate) + ' - ' + getHour(event.endDate);

export const filterEvents = (events: CalendarEvent[], from: Date, to: Date) => {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return events.filter((event) => {
    const etime = event.startDate.getTime();
    return etime >= fromTime && etime <= toTime;
  });
};

const changeCounterToMembership = (firestore: Firestore, user: User, groupMembership: TrainerContactMembership, group: TrainingGroupType, isAdd: boolean) => {
  const path = `trainers/${groupMembership.trainer.trainerId}/members`;
  const collectionRef = getCollectionRef(firestore, path);
  const docRef = doc(collectionRef, user.id);
  const modifier = isAdd ? 1 : -1;
  const ticketSheet = findOrCreateSheet(groupMembership.membership, group.groupType);
  ticketSheet.presenceNo += modifier;
  ticketSheet.remainingEventNo += -modifier;
  // refresh name and avatar
  groupMembership.membership.name = user.name;
  groupMembership.membership.avatar = user.photoURL;
  return setDoc(docRef, groupMembership.membership);
};

const MAX_MEMBERSHIP_ERROR = 'error.maxMembershipRiched';
const EVENT_DELETED_ERROR = 'error.eventDeleted';
export const isMaxMembershipError = (error: string) => error === MAX_MEMBERSHIP_ERROR;

export const EVENT_DATE_PROPS = ['startDate', 'endDate'];

export const changeMembershipToEvent = (firestore: Firestore, trainerEvent: TrainerEvent, user: User, membership: TrainerContactMembership, isAdd: boolean) => {
  const path = `trainers/${trainerEvent.trainerId}/events`;
  const collectionRef = getCollectionRef(firestore, path, EVENT_DATE_PROPS);
  const docRef = doc(collectionRef, trainerEvent.id);
  const group = membership.trainerGroups.find((gr) => gr.id === trainerEvent.groupId)!;
  return new Promise<void>((resolve, reject) => {
    getDoc(docRef).then(docSnapshot => {
      const data = (docSnapshot.data() || trainerEvent) as TrainerEvent;
      if (data.isDeleted) {
        reject(EVENT_DELETED_ERROR);
        return;
      }
      if (isAdd) {
        if (group.maxMember <= data.memberIds.length) {
          reject(MAX_MEMBERSHIP_ERROR);
          return;
        }
        data.memberIds.push(user.id);
      } else {
        const idx = data.memberIds.indexOf(user.id);
        data.memberIds.splice(idx, 1);
      }
      setDoc(docRef, data).then(() => {
        changeCounterToMembership(firestore, user, membership, group, isAdd).then(() => resolve());
      });
    });
  });
};

const createDBEventProvider = (firestore: Firestore, userId: string, trainerGroups: TrainerGroups[]) => {
  let groupRestriction: string | undefined = undefined;

  const getEvents = (from: Date, to: Date) => {
    if (to < from) {
      return Promise.resolve([]);
    }
    return Promise.all(trainerGroups.map((trainerGroup) => {
      const queries = [
        where('startDate', '>=', from.getTime()),
        where('startDate', '<=', to.getTime()),
      ];
      return doQuery(firestore, `trainers/${trainerGroup.trainer.trainerId}/events`, EVENT_DATE_PROPS, ...queries).then((result) => {
        if (!trainerGroup.isAllGroup) {
          const groups = trainerGroup.contactGroups.map((gr) => gr.id);
          const filtered = groupRestriction ? (groups.includes(groupRestriction) ? [groupRestriction] : []) : groups;
          return result.filter((r) => r.memberIds.includes(userId) || filtered.includes(r.groupId));
        }
        return result;
      });
    })).then((data) => {
      const allEvent: TrainerEvent[] = [].concat.apply([], data as [][]);
      allEvent.forEach((event) => event.badge = event.memberIds?.length.toString() || '0');
      allEvent.sort(EVENT_COMPARE);
      return allEvent;
    });
  };

  const setGroupRestriction = (groupId: string | undefined) => {
    groupRestriction = groupId;
  };

  return {
    getEvents,
    setGroupRestriction,
  } as EventProvider;
};

const createEventProvider = (firestore: Firestore, userId: string, trainerGroups: TrainerGroups[]) => {
  const dbEventProvider = createDBEventProvider(firestore, userId, trainerGroups);
  let groupRestriction: string | undefined = undefined;

  const getEvents = (from: Date, to: Date) => {
    if (trainerGroups.length === 0) {
      return Promise.resolve([]);
    }
    return dbEventProvider.getEvents(from, to).then((events: TrainerEvent[]) => {
      const now = new Date();
      if (now >= to) {
        return events;
      }
      trainerGroups.forEach((trainerGroup) => {
        const filtered = groupRestriction ? trainerGroup.contactGroups.filter((m) => m.id === groupRestriction) : trainerGroup.contactGroups;
        filtered.forEach((group) => appendCronEvents(events, group, trainerGroup.trainer, now > from ? now : from, to));
      });
      events.sort(EVENT_COMPARE);
      return events;
    });
  };

  const setGroupRestriction = (groupId: string | undefined) => {
    groupRestriction = groupId;
    dbEventProvider.setGroupRestriction(groupId);
  };

  return {
    getEvents,
    setGroupRestriction,
  } as EventProvider;
};

export const createUserEventProvider = (firestore: Firestore, user: User, memberships: TrainerContactMembership[]) =>
  createEventProvider(firestore, user.id, memberships);

export const createTrainerEventProvider = (firestore: Firestore, trainer: User, contactGroups: TrainingGroupType[]) => {
  const trainerGroup: TrainerGroups = {
    isAllGroup: true,
    trainer: {
      trainerId: trainer.id,
      trainerName: trainer.name,
    },
    contactGroups,
  };
  return createEventProvider(firestore, trainer.id, [trainerGroup]);
};