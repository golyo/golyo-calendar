import { Dispatch, SetStateAction, useCallback } from 'react';
import { changeItem, removeStr, useFirestore } from '../firestore/firestore';
import { GroupType, MembershipType, TrainerState, TrainingGroupType } from './TrainerContext';
import { EVENT_DATE_PROPS, TrainerEvent } from '../event';
import { User } from '../user';
import { WEEK_EVENT_CHANGED, WeekEventType } from '../../view/calendar/WeekView';
import { generateCronEvent } from '../event/eventUtil';

const createSheet = (type: GroupType) => ({
  type,
  presenceNo: 0,
  remainingEventNo: 0,
  purchasedTicketNo: 0,
});

export const findOrCreateSheet = (memberShip: MembershipType, type: GroupType) => {
  const sheet = memberShip.ticketSheets.find((sh) => sh.type === type);
  if (sheet) {
    return sheet;
  }
  const newSheet = createSheet(type);
  memberShip.ticketSheets.push(newSheet);
  return newSheet;
};

const useTrainerEvents = (user: User, groups: TrainingGroupType[], members: MembershipType[], setState: Dispatch<SetStateAction<TrainerState>>) => {
  const eventSrv = useFirestore<TrainerEvent>(`trainers/${user.id}/events`, EVENT_DATE_PROPS);
  const memberSrv = useFirestore<MembershipType>(`trainers/${user.id}/members`);
  const findGroup = useCallback((groupId: string) => groups.find((g) => g.id === groupId)!, [groups]);

  const changeMembershipValues = useCallback((
    memberId: string,
    groupType: GroupType,
    ticketNoChanges: number,
    eventNoChanges: number,
    presenceNoChanges: number,
    useMessage?: boolean,
  ) => {
    return memberSrv.getAndModify(memberId, (member) => {
      const sheet = findOrCreateSheet(member, groupType);
      sheet.purchasedTicketNo += ticketNoChanges;
      sheet.remainingEventNo += eventNoChanges;
      sheet.presenceNo += presenceNoChanges;
      return member;
    }, useMessage || false).then((member) => {
      setState((prev) => ({
        ...prev,
        members: changeItem(prev.members!, member),
      }));
      return member;
    });
  }, [memberSrv, setState]);

  const buySeasonTicket = useCallback((memberId: string, groupId: string) => {
    const group = findGroup(groupId);
    return changeMembershipValues(memberId, group.groupType, 1, group.ticketLength, 0, true);
  }, [changeMembershipValues, findGroup]);

  const dispatchEventChanged = useCallback((changedEvent: TrainerEvent, type: WeekEventType) => {
    changedEvent.badge = changedEvent.memberIds.length.toString();
    const eventChanged = new CustomEvent(WEEK_EVENT_CHANGED, {
      detail: {
        changedEvent,
        type,
      },
    });
    window.dispatchEvent(eventChanged);
    return changedEvent;
  }, []);

  const getMemberNames = useCallback((event: TrainerEvent) => {
    return event.memberIds.map((memberId) => members.find((m) => m.id === memberId)?.name || '');
  }, [members]);

  const createEvent = useCallback((group:TrainingGroupType, startDate: Date) => {
    const event = generateCronEvent(group,  {
      trainerId: user.id,
      trainerName: user.name,
    }, startDate);
    event.deletable = true;
    return eventSrv.save(event).then(() => dispatchEventChanged(event, WeekEventType.ADDED));
  }, [dispatchEventChanged, eventSrv, user.id, user.name]);

  const deleteEvent = useCallback((toSave: TrainerEvent) => {
    const group = findGroup(toSave.groupId);
    if (toSave.deletable) {
      return eventSrv.get(toSave.id).then((saved) => {
        if (saved) {
          saved.memberIds.forEach((memberId) => changeMembershipValues(memberId, group.groupType, 0, 1, -1));
          return eventSrv.remove(toSave.id).then(() => {
            dispatchEventChanged(toSave, WeekEventType.REMOVED);
          });
        } else {
          return Promise.resolve();
        }
      });
    }
    return eventSrv.getAndModify(toSave.id, (event) => {
      const modified = event || toSave;
      modified.memberIds.forEach((memberId) => changeMembershipValues(memberId, group.groupType, 0, 1, -1));
      return {
        ...modified,
        isDeleted: true,
        memberIds: [],
      };
    }).then((event) => {
      dispatchEventChanged(event, WeekEventType.CHANGED);
    });
  }, [changeMembershipValues, dispatchEventChanged, eventSrv, findGroup]);

  const activateEvent = useCallback((toSave: TrainerEvent) => {
    return eventSrv.getAndModify(toSave.id, (event) => {
      event.isDeleted = false;
      return event;
    }).then((event) => dispatchEventChanged(event, WeekEventType.CHANGED));
  }, [dispatchEventChanged, eventSrv]);

  const addMemberToEvent = useCallback((event: TrainerEvent, member: MembershipType) => {
    const group = findGroup(event.groupId);
    changeMembershipValues(member.id, group.groupType, 0, -1, 1);
    return eventSrv.getAndModify(event.id, (toSave) => {
      toSave.memberIds.push(member.id);
      return toSave;
    }).then((result) => dispatchEventChanged(result, WeekEventType.CHANGED));
  }, [changeMembershipValues, dispatchEventChanged, eventSrv, findGroup]);

  const removeMemberFromEvent = useCallback((eventId: string, groupType: GroupType, memberId: string, ticketBack: boolean) => {
    changeMembershipValues(memberId, groupType, 0, (ticketBack ? 1 : 0), -1);
    return eventSrv.getAndModify(eventId, (event) => {
      removeStr(event.memberIds, memberId);
      return event;
    }).then((result) => dispatchEventChanged(result, WeekEventType.CHANGED));
  }, [changeMembershipValues, dispatchEventChanged, eventSrv]);

  return {
    activateEvent,
    addMemberToEvent,
    buySeasonTicket,
    createEvent,
    deleteEvent,
    getMemberNames,
    removeMemberFromEvent,
  };
};

export default useTrainerEvents;