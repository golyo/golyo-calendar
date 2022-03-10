import React, { ReactNode, useCallback, useContext, useMemo } from 'react';
import GroupContext from './GroupContext';
import { CronConverter, User, useUser } from '../user';
import { changeItem, removeItemById, useFirestore } from '../firestore/firestore';
import { UserGroup } from '../user/UserContext';
import { useTrainer } from './TrainerProvider';
import { EVENT_DATE_PROPS, TrainerEvent } from '../event';
import { GroupType, MembershipType, MemberState, TrainingGroupType, TrainingGroupUIType } from './TrainerContext';

export const DEFAULT_GROUP: TrainingGroupUIType = {
  id: '',
  name: '',
  groupType: GroupType.GROUP,
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
  attachedGroups: [],
};

export const convertGroupToFirestore: (data: TrainingGroupUIType, cronConverter: CronConverter) => TrainingGroupType =
  (data: TrainingGroupUIType, cronConverter: CronConverter) => ({
    ...data,
    crons: data.crons.map((uiCron) => cronConverter.toCron(uiCron)),
  });

export const convertGroupToUi: (data: TrainingGroupType, cronConverter: CronConverter) => TrainingGroupUIType =
  (data: any, cronConverter: CronConverter) => ({
    ...data,
    attachedGroups: data.attachedGroups || [],
    crons: data.crons.map((cron: string) => cronConverter.toUiCron(cron)),
  });

const GroupProvider = ({ groupId, children }: { groupId: string, children: ReactNode }) => {
  const { user, cronConverter } = useUser();
  const { groups, members, membershipChanged } = useTrainer();

  const eventSrv = useFirestore<TrainerEvent>(`trainers/${user!.id}/events`, EVENT_DATE_PROPS);
  const userSrv = useFirestore<User>('users');
  const memberSrv = useFirestore<MembershipType>(`trainers/${user?.id}/groups/${groupId}/members`);

  const group = useMemo(() => {
    const dbGroup = groups.find((find) => find.id === groupId);
    return convertGroupToUi(dbGroup!, cronConverter);
  }, [cronConverter, groupId, groups]);

  const attachedGroups = useMemo(() => {
    if (!group) {
      return [];
    }
    return (group.attachedGroups || []).map((attachedId) => groups.find((dbGroup) => dbGroup.id === attachedId)!);
  }, [group, groups]);

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
        groupId: groupId,
        trainerId: user!.id,
        trainerName: user!.name,
      });
      membershipChanged(changeItem(members, requested));
    });
  }, [members, memberSrv, setUserMemberships, groupId, user, membershipChanged]);

  const loadEvent = useCallback((eventId: string) => eventSrv.get(eventId), [eventSrv]);

  const buySeasonTicket = useCallback((memberId: string) => {
    return memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      purchasedTicketNo: member.purchasedTicketNo + 1,
      remainingEventNo: member.remainingEventNo + group!.ticketLength,
    })).then((member) => {
      membershipChanged(changeItem(members, member));
      return member;
    });
  }, [group, memberSrv, members, membershipChanged]);

  const removeMemberFromEvent = useCallback((eventId: string, memberId: string, ticketBack: boolean) => {
    memberSrv.getAndModify(memberId, (member) => ({
      ...member,
      remainingEventNo: member.remainingEventNo + (ticketBack ? 1 : 0),
      presenceNo: member.presenceNo - 1,
    }), false).then((member) => {
      membershipChanged(changeItem(members, member));
    });
    return eventSrv.getAndModify(eventId, (event) => ({
      ...event,
      members: removeItemById(event.members, memberId),
    }));
  }, [eventSrv, memberSrv, members, membershipChanged]);

  const removeTrainerRequest = useCallback((requested: MembershipType) => {
    return memberSrv.remove(requested.id).then(() => {
      removeUserMembership(requested.id);
      membershipChanged(removeItemById(members, requested.id));
    });
  }, [memberSrv, members, membershipChanged, removeUserMembership]);
  
  const updateMembership = useCallback((membership: MembershipType) => {
    return memberSrv.save(membership).then(() => {
      membershipChanged(changeItem(members, membership));
    });
  }, [memberSrv, members, membershipChanged]);

  const updateMembershipState = useCallback((requested: MembershipType, toState: MemberState | null) => {
    if (toState === null) {
      return removeTrainerRequest(requested);
    }
    requested.state = toState;
    if (toState === MemberState.TRAINER_REQUEST) {
      return createTrainerRequest(requested);
    }
    return memberSrv.save(requested).then(() => {
      membershipChanged(changeItem(members, requested));
    });
  }, [createTrainerRequest, memberSrv, members, membershipChanged, removeTrainerRequest]);

  const ctx = {
    buySeasonTicket,
    attachedGroups,
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