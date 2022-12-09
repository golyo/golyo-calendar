import { Dispatch, SetStateAction, useCallback } from 'react';
import { changeItem, useFirestore } from '../firestore/firestore';
import { GroupType, MembershipType, TicketSheet, TrainerState, TrainingGroupType } from './TrainerContext';
import { EVENT_DATE_PROPS, TrainerEvent } from '../event';
import { User } from '../user';
import { WEEK_EVENT_CHANGED, WeekEventType } from '../../view/calendar/WeekView';
import { generateCronEvent } from '../event/eventUtil';
import { useUtils } from '@mui/x-date-pickers/internals/hooks/useUtils';

const createSheet = (type: GroupType) => ({
  type,
  presenceNo: 0,
  remainingEventNo: 0,
  purchasedTicketNo: 0,
} as TicketSheet);

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
  const utils = useUtils();
  
  const changeMembershipValues = useCallback((
    memberId: string,
    groupType: GroupType,
    ticketNoChanges: number,
    eventNoChanges: number,
    presenceNoChanges: number,
    useMessage = false,
  ) => {
    return memberSrv.getAndModify(memberId, (member) => {
      const sheet = findOrCreateSheet(member, groupType);
      sheet.purchasedTicketNo += ticketNoChanges;
      sheet.remainingEventNo += eventNoChanges;
      sheet.ticketBuyDate = utils.toJsDate(utils.endOfDay(utils.date())).getTime();
      sheet.presenceNo += presenceNoChanges;
      return member;
    }, true, useMessage).then((member) => {
      setState((prev) => ({
        ...prev,
        members: changeItem(prev.members!, member),
      }));
      return member;
    }).catch((err) => {
      if (err.toString().startsWith('Not found data in database')) {
        return undefined;
      }
      throw err;
    });
  }, [memberSrv, setState, utils]);

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

  const addMemberToEvent = useCallback((event: TrainerEvent, memberId: string, memberName: string) => {
    const group = findGroup(event.groupId);
    changeMembershipValues(memberId, group.groupType, 0, -1, 1);
    return eventSrv.getAndModify(event.id, (toSave) => {
      const checkIfExist = toSave || event;
      checkIfExist.memberIds.push(memberId);
      checkIfExist.memberNames.push(memberName);
      return checkIfExist;
    }).then((result) => {
      return dispatchEventChanged(result, WeekEventType.CHANGED);
    });
  }, [changeMembershipValues, dispatchEventChanged, eventSrv, findGroup]);

  const removeMemberFromEvent = useCallback((event: TrainerEvent, memberId: string, ticketBack: boolean) => {
    const group = findGroup(event.groupId);
    changeMembershipValues(memberId, group.groupType, 0, (ticketBack ? 1 : 0), -1);
    return eventSrv.getAndModify(event.id, (toSave) => {
      const idx = toSave.memberIds.indexOf(memberId);
      if (idx >= 0) {
        toSave.memberIds.splice(idx, 1);
        toSave.memberNames.splice(idx, 1);
      }
      return toSave;
    }).then((result) => dispatchEventChanged(result, WeekEventType.CHANGED));
  }, [changeMembershipValues, dispatchEventChanged, eventSrv, findGroup]);

  return {
    activateEvent,
    addMemberToEvent,
    buySeasonTicket,
    createEvent,
    deleteEvent,
    removeMemberFromEvent,
  };
};

export default useTrainerEvents;