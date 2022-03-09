import parser, { CronDate } from 'cron-parser';
import { User, UserGroupMembership } from '../../hooks/user';
import { CalendarEvent, EventProvider, TrainerEvent } from './EventContext';
import { UserGroup } from '../user/UserContext';
import { Firestore, getDoc, doc, where, setDoc } from 'firebase/firestore';
import { doQuery, getCollectionRef } from '../firestore/firestore';
import { TrainingGroupType } from '../trainer/GroupContext';

const NEXT_EVENT_DAYNO = 7;
const NEXT_EVENTS_RANGE = NEXT_EVENT_DAYNO * 24 * 60 * 60 * 1000;

const EVENT_COMPARE = (event1: CalendarEvent, event2: CalendarEvent) => event1.startDate.getTime() - event2.endDate.getTime();

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

const generateCronEvent = (membership: UserGroupMembership, startDate: Date) => {
  const group = membership.group;
  return {
    id: startDate.getTime().toString(),
    groupId: group.id,
    trainerId: membership.trainerId,
    title: membership.trainerName,
    maxMember: group.maxMember,
    text: group.name,
    startDate: startDate,
    endDate: new Date(startDate.getTime() + (group.duration * 60 * 1000)),
    color: group.color,
    members: [],
  } as TrainerEvent;
};

const appendCronEvents = (events: TrainerEvent[], membership: UserGroupMembership, from: Date, to: Date) => {
  membership.group.crons.forEach((cron) => {
    const interval = getCronInterval(cron, from, to);
    while (interval.hasNext()) {
      const aa = interval.next() as IteratorReturnResult<CronDate>;
      const eventDate = aa.value.toDate();
      if (!events.some((event) => event.startDate.getTime() === eventDate.getTime())) {
        events.push(generateCronEvent(membership, eventDate));
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

const changeCounterToMembership = (firestore: Firestore, user: User, groupMembership: UserGroupMembership, isAdd: boolean) => {
  const path = `trainers/${groupMembership.trainerId}/groups/${groupMembership.groupId}/members`;
  const collectionRef = getCollectionRef(firestore, path);
  const docRef = doc(collectionRef, user.id);
  const modifier = isAdd ? 1 : -1;
  groupMembership.membership = {
    ...groupMembership.membership,
    avatar: user.photoURL,
    name: user.name,
    presenceNo: groupMembership.membership.presenceNo + modifier,
    remainingEventNo: groupMembership.membership.remainingEventNo - modifier,
  };
  return setDoc(docRef, groupMembership.membership);
};

const MAX_MEMBERSHIP_ERROR = 'error.maxMembershipRiched';
export const isMaxMembershipError = (error: string) => error === MAX_MEMBERSHIP_ERROR;

export const EVENT_DATE_PROPS = ['startDate', 'endDate'];

export const changeMembershipToEvent = (firestore: Firestore, trainerEvent: TrainerEvent, user: User, membership: UserGroupMembership, isAdd: boolean) => {
  const path = `trainers/${trainerEvent.trainerId}/events`;
  const collectionRef = getCollectionRef(firestore, path, EVENT_DATE_PROPS);
  const docRef = doc(collectionRef, trainerEvent.id);
  return new Promise<void>((resolve, reject) => {
    getDoc(docRef).then(docSnapshot => {
      const data = (docSnapshot.data() || trainerEvent) as TrainerEvent;
      if (isAdd) {
        if (membership.group.maxMember <= data.members.length) {
          reject(MAX_MEMBERSHIP_ERROR);
          return;
        }
        data.members.push({
          id: user.id,
          name: user.name,
        });
      } else {
        const idx = data.members.findIndex((m) => m.id === user.id);
        data.members.splice(idx, 1);
      }
      setDoc(docRef, data).then(() => {
        changeCounterToMembership(firestore, user, membership, isAdd).then(() => resolve());
      });
    });
  });
};

const getTrainerGroups = (userGroups: UserGroup[], groupId: string | undefined) => {
  const trainerGroups: Record<string, string[]> = {};
  userGroups.forEach((group) => {
    if (!groupId || group.groupId === groupId) {
      trainerGroups[group.trainerId] = trainerGroups[group.trainerId] || [];
      trainerGroups[group.trainerId].push(group.groupId);
    }
  });
  return trainerGroups;
};

const createDBEventProvider = (firestore: Firestore, userGroups: UserGroupMembership[]) => {
  let groupRestriction: string | undefined = undefined;

  const getEvents = (from: Date, to: Date) => {
    if (to < from) {
      return Promise.resolve([]);
    }
    const trainerGroups = getTrainerGroups(userGroups, groupRestriction);
    return Promise.all(Object.keys(trainerGroups).map((trainerKey) => {
      const groups = trainerGroups[trainerKey];
      return doQuery(firestore, `trainers/${trainerKey}/events`, EVENT_DATE_PROPS, where('groupId', 'in', groups),
        where('startDate', '>=', from.getTime()), where('startDate', '<=', to.getTime()));
    })).then((data) => {
      const allEvent = [].concat.apply([], data as [][]);
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

export const createUserEventProvider = (firestore: Firestore, memberships: UserGroupMembership[]) => {
  const dbEventProvider = createDBEventProvider(firestore, memberships);
  let groupRestriction: string | undefined = undefined;

  const getEvents = (from: Date, to: Date) => {
    if (memberships.length === 0) {
      return Promise.resolve([]);
    }
    return dbEventProvider.getEvents(from, to).then((events: TrainerEvent[]) => {
      const now = new Date();
      if (now >= to) {
        return events;
      }
      const filtered = groupRestriction ? memberships.filter((m) => m.groupId === groupRestriction) : memberships;
      filtered.forEach((membership) => appendCronEvents(events, membership, now > from ? now : from, to));
      if (filtered.length > 1) {
        events.sort(EVENT_COMPARE);
      }
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

export const createTrainerEventProvider = (firestore: Firestore, trainer: User, groups: TrainingGroupType[]) => {
  const groupMemberships = groups.map((group) => ({
    group,
    trainerName: trainer.name,
    trainerId: trainer.id,
    groupId: group.id,
  } as UserGroupMembership));
  return createUserEventProvider(firestore, groupMemberships);
};