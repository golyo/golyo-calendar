import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import GroupContext, {
  MembershipType,
  MemberState,
  TrainingGroupType,
  TrainingGroupUIType,
} from './GroupContext';
import { CronConverter, User, useUser } from '../user';
import { changeItem, removeItemById, useFirestore } from '../firestore/firestore';
import { UserGroup } from '../user/UserContext';
import { useTrainer } from './TrainerProvider';
import { EVENT_DATE_PROPS, TrainerEvent } from '../event';

export const DEFAULT_GROUP: TrainingGroupUIType = {
  id: '',
  name: '',
  color: '',
  duration: 60,
  ticketLength: 10,
  maxMember: 12,
  inviteOnly: false,
  crons: [{
    days: [],
    time: '',
  }],
};

export const convertGroupToFirestore: (data: TrainingGroupUIType, cronConverter: CronConverter) => TrainingGroupType =
  (data: TrainingGroupUIType, cronConverter: CronConverter) => ({
    ...data,
    crons: data.crons.map((uiCron) => cronConverter.toCron(uiCron)),
  });

export const convertGroupToUi: (data: TrainingGroupType, cronConverter: CronConverter) => TrainingGroupUIType =
  (data: any, cronConverter: CronConverter) => ({
    ...data,
    crons: data.crons.map((cron: string) => cronConverter.toUiCron(cron)),
  });

const GroupProvider = ({ groupId, children }: { groupId: string, children: ReactNode }) => {
  const { findGroup } = useTrainer();
  const { user } = useUser();
  const [group, setGroup] = useState<TrainingGroupUIType>();
  const eventSrv = useFirestore<TrainerEvent>(`users/${user!.id}/events`, EVENT_DATE_PROPS);

  const [members, setMembers] = useState<MembershipType[]>([]);

  const userSrv = useFirestore<User>('users');
  const memberSrv = useFirestore<MembershipType>(`users/${user?.id}/groups/${groupId}/members`);

  const loadMemberList = useCallback(() => memberSrv.listAll().then((dbMembers) => {
    if (dbMembers.length > 0) {
      setMembers(dbMembers);
    }
  }), [memberSrv]);

  const setUserMemberships = useCallback((userId: string, userGroup: UserGroup) => {
    return userSrv.get(userId).then((dbUser) => {
      const addUser = dbUser || { id: userId, memberships: [] };
      const dbGroupIdx = addUser.memberships.findIndex((dbUserGroup: UserGroup) => dbUserGroup.groupId === userGroup.groupId);
      if (dbGroupIdx < 0) {
        addUser.memberships.push(userGroup);
        userSrv.save(addUser, true, false);
      }
    });
  }, [userSrv]);

  const removeUserMembership = useCallback((userId: string) => {
    userSrv.get(userId).then((dbUser) => {
      if (!dbUser) {
        return;
      }
      const dbGroupIdx = dbUser.memberships.findIndex((dbUserGroup: UserGroup) => dbUserGroup.groupId === group!.id);
      if (dbGroupIdx >= 0) {
        dbUser.memberships.splice(dbGroupIdx, 1);
        if (dbUser.memberships.length === 0 && !dbUser.registrationDate) {
          userSrv.remove(dbUser.id, false);
        } else {
          userSrv.save(dbUser, true, false);
        }
      }
    });
  }, [group, userSrv]);

  const createTrainerRequest = useCallback((requested: MembershipType) => {
    if (members && members.findIndex((member) => member.id === requested.id) >= 0) {
      // SHOW ERROR
      return Promise.reject('Already exists');
    }
    return memberSrv.save(requested).then(() => {
      setUserMemberships(requested.id, {
        groupId: group!.id!,
        trainerId: user!.id,
        trainerName: user!.name,
      });
      setMembers([
        ...members || [],
        requested,
      ]);
    });
  }, [members, memberSrv, setUserMemberships, user, group]);

  const loadEvent = useCallback((eventId: string) => eventSrv.get(eventId), [eventSrv]);

  const buySeasonTicket = useCallback((memberId: string) => {
    return memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      purchasedTicketNo: member.purchasedTicketNo + 1,
      remainingEventNo: member.remainingEventNo + group!.ticketLength,
    })).then((member) => {
      setMembers((prev) => changeItem(prev, member));
      return member;
    });
  }, [group, memberSrv]);

  const removeMemberFromEvent = useCallback((eventId: string, memberId: string, ticketBack: boolean) => {
    memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      remainingEventNo: member.remainingEventNo + (ticketBack ? 1 : 0),
      presenceNo: member.presenceNo - 1,
    }), false).then((member) => setMembers((prev) => changeItem(prev, member)));
    return eventSrv.getAndModify(eventId, (event) => ({
      ...event,
      members: removeItemById(event.members, memberId),
    }));
  }, [eventSrv, memberSrv]);

  const removeTrainerRequest = useCallback((requested: MembershipType) => {
    return memberSrv.remove(requested.id).then(() => {
      removeUserMembership(requested.id);
      setMembers((prevMembers) => removeItemById(prevMembers, requested.id));
    });
  }, [memberSrv, removeUserMembership]);
  
  const updateMembershipState = useCallback((requested: MembershipType, toState: MemberState | null) => {
    if (toState === null) {
      return removeTrainerRequest(requested);
    }
    requested.state = toState;
    if (toState === MemberState.TRAINER_REQUEST) {
      return createTrainerRequest(requested);
    }
    return memberSrv.save(requested).then(() => {
      setMembers((prev) => {
        const idx = prev.findIndex((m) => m.id === requested.id);
        if (idx >= 0) {
          prev[idx].state = toState;
        }
        return [ ...prev ];
      });
    });
  }, [createTrainerRequest, memberSrv, removeTrainerRequest]);

  useEffect(() => {
    if (groupId === 'new') {
      setGroup(DEFAULT_GROUP);
      return;
    }
    const myGroup = findGroup(groupId);
    if (myGroup) {
      setGroup(myGroup);
      loadMemberList();
    }
  }, [groupId, loadMemberList, findGroup]);

  const ctx = useMemo(() => ({
    buySeasonTicket,
    group,
    loadEvent,
    members,
    updateMembershipState,
    removeMemberFromEvent,
  }), [buySeasonTicket, group, loadEvent, members, updateMembershipState, removeMemberFromEvent]);

  if (!user || !group) {
    return null;
  }
  return <GroupContext.Provider value={ctx}>{ children }</GroupContext.Provider>;
};

const useGroup = () => useContext(GroupContext);

export { useGroup };

export default GroupProvider;