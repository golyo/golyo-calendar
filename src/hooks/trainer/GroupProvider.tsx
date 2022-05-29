import React, { ReactNode, useCallback, useContext, useMemo } from 'react';
import GroupContext from './GroupContext';
import { CronConverter, User, useUser } from '../user';
import { changeItem, removeItemById, useFirestore } from '../firestore/firestore';
import { TrainerContact } from '../user/UserContext';
import { useTrainer } from './TrainerProvider';
import { EVENT_DATE_PROPS, TrainerEvent } from '../event';
import {
  GroupType,
  MembershipType,
  MemberState, TrainingGroupBase,
  TrainingGroupType,
  TrainingGroupUIType,
} from './TrainerContext';
import { useTranslation } from 'react-i18next';
import { findOrCreateSheet } from './useTrainerEvents';

export const DEFAULT_GROUP: TrainingGroupUIType = {
  id: '',
  name: '',
  groupType: GroupType.GROUP,
  color: '',
  duration: 60,
  cancellationDeadline: 4,
  ticketLength: 10,
  ticketValidity: 0,
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
    ticketValidity: data.ticketValidity || 0,
    crons: data.crons.map((cron: string) => cronConverter.toUiCron(cron)),
  });

export const getGroupMembers = (members: MembershipType[], group: TrainingGroupBase) => {
  return members.filter((member) => member.groups.includes(group.id) ||
    (group.attachedGroups && group.attachedGroups.some((attachedId) => member.groups.includes(attachedId))));
};

const GroupProvider = ({ groupId, children }: { groupId: string, children: ReactNode }) => {
  const { t } = useTranslation();
  const { user, cronConverter } = useUser();
  const { groups, members, membershipChanged, sendEmail } = useTrainer();

  const eventSrv = useFirestore<TrainerEvent>(`trainers/${user!.id}/events`, EVENT_DATE_PROPS);
  const userSrv = useFirestore<User>('users');
  const memberSrv = useFirestore<MembershipType>(`trainers/${user?.id}/members`);

  const group = useMemo(() => {
    const dbGroup = groups.find((find) => find.id === groupId)!;
    return convertGroupToUi(dbGroup, cronConverter);
  }, [cronConverter, groupId, groups]);

  const groupMembers = useMemo(() => getGroupMembers(members, group!), [group, members]);

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
    findOrCreateSheet(toSave, group!.groupType);
    return memberSrv.save(toSave).then(() => {
      setUserMemberships(toSave.id, {
        trainerId: user!.id,
        trainerName: user!.name,
      });
      membershipChanged(changeItem(members, toSave));
      sendEmail(requested.id, t('email.trainerRequest.subject'), t('email.trainerRequest.html', {
        trainer: user!.name,
        link: 'https://camp-fire-d8b07.firebaseapp.com/',
      }));
    });
  }, [members, group, memberSrv, setUserMemberships, user, membershipChanged, sendEmail, t]);

  const loadEvent = useCallback((eventId: string) => eventSrv.get(eventId), [eventSrv]);

  const removeTrainerRequest = useCallback((requested: MembershipType) => {
    return memberSrv.remove(requested.id).then(() => {
      removeUserMembership(requested.id);
      membershipChanged(removeItemById(members, requested.id));
    });
  }, [memberSrv, members, membershipChanged, removeUserMembership]);
  
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
    attachedGroups,
    group,
    groupMembers,
    loadEvent,
    updateMembershipState,
  };

  if (!user || !group) {
    return null;
  }
  return <GroupContext.Provider value={ctx}>{ children }</GroupContext.Provider>;
};

const useGroup = () => useContext(GroupContext);

export { useGroup };

export default GroupProvider;