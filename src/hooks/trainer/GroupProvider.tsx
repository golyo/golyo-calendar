import React, { ReactNode, useCallback, useContext, useMemo } from 'react';
import GroupContext from './GroupContext';
import { CronConverter, User, useUser } from '../user';
import { changeItem, removeItemById, useFirestore } from '../firestore/firestore';
import { TrainerContact } from '../user/UserContext';
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

const createSheet = (type: GroupType) => ({
  type,
  presenceNo: 0,
  remainingEventNo: 0,
  purchasedTicketNo: 0,
});

const GroupProvider = ({ groupId, children }: { groupId: string, children: ReactNode }) => {
  const { user, cronConverter } = useUser();
  const { groups, members, membershipChanged } = useTrainer();

  const eventSrv = useFirestore<TrainerEvent>(`trainers/${user!.id}/events`, EVENT_DATE_PROPS);
  const userSrv = useFirestore<User>('users');
  const memberSrv = useFirestore<MembershipType>(`trainers/${user?.id}/members`);

  const group = useMemo(() => {
    const dbGroup = groups.find((find) => find.id === groupId);
    return convertGroupToUi(dbGroup!, cronConverter);
  }, [cronConverter, groupId, groups]);

  const groupMembers = useMemo(() => {
    return members.filter((member) => member.groups.includes(group.id) ||
      group.attachedGroups.some((attachedId) => member.groups.includes(attachedId)));
  }, [group, members]);

  const attachedGroups = useMemo(() => {
    if (!group) {
      return [];
    }
    return (group.attachedGroups || []).map((attachedId) => groups.find((dbGroup) => dbGroup.id === attachedId)!);
  }, [group, groups]);

  const setUserMemberships = useCallback((userId: string, trainerContact: TrainerContact) => {
    return userSrv.get(userId).then((dbUser) => {
      const addUser = dbUser || { id: userId, memberships: [] };
      const dbGroupIdx = addUser.memberships.findIndex((dbTrainerContact: TrainerContact) => dbTrainerContact.trainerId === user!.id);
      if (dbGroupIdx < 0) {
        addUser.memberships.push(trainerContact);
        userSrv.save(addUser, true, false);
      }
    });
  }, [user, userSrv]);

  const removeUserMembership = useCallback((userId: string) => {
    userSrv.get(userId).then((dbUser) => {
      if (!dbUser) {
        return;
      }
      const dbGroupIdx = dbUser.memberships.findIndex((dbTrainerContact: TrainerContact) => dbTrainerContact.trainerId === user!.id);
      if (dbGroupIdx >= 0) {
        dbUser.memberships.splice(dbGroupIdx, 1);
        if (dbUser.memberships.length === 0 && !dbUser.registrationDate) {
          userSrv.remove(dbUser.id, false);
        } else {
          userSrv.save(dbUser, true, false);
        }
      }
    });
  }, [user, userSrv]);

  const createTrainerRequest = useCallback((requested: MembershipType) => {
    const toSave = members.find((m) => m.id === requested.id) || requested;
    if (!toSave.groups.includes(group.id)) {
      toSave.groups.push(group.id);
    }
    if (!toSave.ticketSheets.some((sheet) => sheet.type === group.groupType)) {
      toSave.ticketSheets.push(createSheet(group.groupType));
    }
    return memberSrv.save(toSave).then(() => {
      setUserMemberships(toSave.id, {
        trainerId: user!.id,
        trainerName: user!.name,
      });
      membershipChanged(changeItem(members, toSave));
    });
  }, [members, group.id, group.groupType, memberSrv, setUserMemberships, user, membershipChanged]);

  const loadEvent = useCallback((eventId: string) => eventSrv.get(eventId), [eventSrv]);

  const changeMembershipValues = useCallback((memberId: string, ticketNoChanges: number, eventNoChanges: number, presenceNoChanges: number) => {
    return memberSrv.getAndModify(memberId, (member) => {
      const sheet = member.ticketSheets.find((sh) => sh.type === group.groupType)!;
      sheet.purchasedTicketNo += ticketNoChanges;
      sheet.remainingEventNo += eventNoChanges;
      sheet.presenceNo += presenceNoChanges;
      return member;
    }).then((member) => {
      membershipChanged(changeItem(members, member));
      return member;
    });
  }, [group.groupType, memberSrv, members, membershipChanged]);

  const buySeasonTicket = useCallback((memberId: string) => changeMembershipValues(memberId, 1, group.ticketLength, 0),
    [changeMembershipValues, group.ticketLength]);

  const removeMemberFromEvent = useCallback((eventId: string, memberId: string, ticketBack: boolean) => {
    changeMembershipValues(memberId, 0, (ticketBack ? 1 : 0), -1);
    return eventSrv.getAndModify(eventId, (event) => ({
      ...event,
      members: removeItemById(event.members, memberId),
    }));
  }, [changeMembershipValues, eventSrv]);

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
    groupMembers,
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