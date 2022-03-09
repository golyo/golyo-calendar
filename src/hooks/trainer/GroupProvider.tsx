import React, { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import GroupContext, {
  MembershipType,
  MemberState, TrainerGroupMemberships,
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
  cancellationDeadline: 4,
  ticketLength: 10,
  maxMember: 12,
  inviteOnly: false,
  crons: [{
    days: [],
    time: '',
  }],
};

export const convertGroupToFirestore: (data: TrainingGroupUIType, cronConverter: CronConverter) => TrainerGroupMemberships =
  (data: TrainingGroupUIType, cronConverter: CronConverter) => ({
    ...data,
    crons: data.crons.map((uiCron) => cronConverter.toCron(uiCron)),
  });

export const convertGroupToUi: (data: TrainerGroupMemberships, cronConverter: CronConverter) => TrainingGroupUIType =
  (data: any, cronConverter: CronConverter) => ({
    ...data,
    crons: data.crons.map((cron: string) => cronConverter.toUiCron(cron)),
  });

const GroupProvider = ({ groupId, children }: { groupId: string, children: ReactNode }) => {
  const { findGroup, membershipChanged } = useTrainer();
  const { user } = useUser();
  const [group, setGroup] = useState<TrainingGroupUIType>();
  const eventSrv = useFirestore<TrainerEvent>(`trainers/${user!.id}/events`, EVENT_DATE_PROPS);

  const userSrv = useFirestore<User>('users');
  const memberSrv = useFirestore<MembershipType>(`trainers/${user?.id}/groups/${groupId}/members`);

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
    if (group!.members && group!.members.findIndex((member) => member.id === requested.id) >= 0) {
      // SHOW ERROR
      return Promise.reject('Already exists');
    }
    return memberSrv.save(requested).then(() => {
      setUserMemberships(requested.id, {
        groupId: group!.id!,
        trainerId: user!.id,
        trainerName: user!.name,
      });
      membershipChanged(group!.id, [
        ...(group?.members || []),
        requested,
      ]);
    });
  }, [group, memberSrv, setUserMemberships, user, membershipChanged]);

  const loadEvent = useCallback((eventId: string) => eventSrv.get(eventId), [eventSrv]);

  const buySeasonTicket = useCallback((memberId: string) => {
    return memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      purchasedTicketNo: member.purchasedTicketNo + 1,
      remainingEventNo: member.remainingEventNo + group!.ticketLength,
    })).then((member) => {
      membershipChanged(group!.id, changeItem(group!.members!, member));
      return member;
    });
  }, [group, memberSrv, membershipChanged]);

  const removeMemberFromEvent = useCallback((eventId: string, memberId: string, ticketBack: boolean) => {
    memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      remainingEventNo: member.remainingEventNo + (ticketBack ? 1 : 0),
      presenceNo: member.presenceNo - 1,
    }), false).then((member) => {
      membershipChanged(group!.id, changeItem(group!.members!, member));
    });
    return eventSrv.getAndModify(eventId, (event) => ({
      ...event,
      members: removeItemById(event.members, memberId),
    }));
  }, [eventSrv, group, memberSrv, membershipChanged]);

  const removeTrainerRequest = useCallback((requested: MembershipType) => {
    return memberSrv.remove(requested.id).then(() => {
      removeUserMembership(requested.id);
      membershipChanged(group!.id, removeItemById(group!.members!, requested.id));
    });
  }, [group, memberSrv, membershipChanged, removeUserMembership]);
  
  const updateMembership = useCallback((membership: MembershipType) => {
    return memberSrv.save(membership).then(() => {
      membershipChanged(group!.id, changeItem(group!.members!, membership));
    });
  }, [group, memberSrv, membershipChanged]);

  const updateMembershipState = useCallback((requested: MembershipType, toState: MemberState | null) => {
    if (toState === null) {
      return removeTrainerRequest(requested);
    }
    requested.state = toState;
    if (toState === MemberState.TRAINER_REQUEST) {
      return createTrainerRequest(requested);
    }
    return memberSrv.save(requested).then(() => {
      membershipChanged(group!.id, changeItem(group!.members!, requested));
    });
  }, [createTrainerRequest, group, memberSrv, membershipChanged, removeTrainerRequest]);

  useEffect(() => {
    if (groupId === 'new') {
      setGroup(DEFAULT_GROUP);
      return;
    }
    findGroup(groupId).then((myGroup) => setGroup(myGroup));
  }, [groupId, findGroup]);

  const ctx = {
    buySeasonTicket,
    group,
    loadEvent,
    updateMembership,
    updateMembershipState,
    removeMemberFromEvent,
  };

  if (!user || !group) {
    return null;
  }
  return <GroupContext.Provider value={ctx}>{ children }</GroupContext.Provider>;
};

const useGroup = () => useContext(GroupContext);

export { useGroup };

export default GroupProvider;