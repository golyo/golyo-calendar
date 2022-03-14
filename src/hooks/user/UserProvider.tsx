import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { User as AuthUser } from 'firebase/auth';

import {
  changeItemByEqual,
  deleteObject, doQuery,
  loadObject,
  removeItemByEqual,
  updateObject,
  useFirestore,
} from '../firestore/firestore';
import { useAuth } from '../auth/AuthProvider';
import UserContext, { User, TrainerContact, TrainerContactMembership } from './UserContext';
import { useFirebase } from '../firebase';
import {
  MembershipType,
  MemberState,
  TrainingGroupType,
  TrainerProvider,
  TrainingGroupUIType,
  DEFAULT_MEMBER,
} from '../trainer';
import { Firestore, where } from 'firebase/firestore';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { createCronConverter } from './cronUtils';
import { createUserEventProvider, getInterval, TrainerEvent } from '../event';

export const loadGroups = (firestore: Firestore, trainerId: string) =>
  doQuery(firestore, `trainers/${trainerId}/groups`);

export const loadMembership = (firestore: Firestore, trainerId: string, userId: string) => {
  return loadObject(firestore, `trainers/${trainerId}/members`, userId);
};

const setMember = (firestore: Firestore, user: User, membership: TrainerContactMembership) => {
  const member: MembershipType = {

    ...membership.membership,
    id: user.id,
    name: user.name,
    avatar: user.photoURL,
  };
  return updateObject(firestore, `trainers/${membership.trainer.trainerId}/members`, member);
};

const addUserRequest = (firestore: Firestore, trainerId: string, user: User, group: TrainingGroupUIType) => {
  const membership: MembershipType = {
    ...DEFAULT_MEMBER,
    state: MemberState.USER_REQUEST,
    name: user!.name,
    id: user!.id,
    groups: [ group.id ],
    ticketSheets:  [{
      type: group.groupType,
      remainingEventNo: 0,
      presenceNo: 0,
      purchasedTicketNo: 0,
    }],
  };
  return updateObject(firestore, `trainers/${trainerId}/members`, membership, false);
};

const DEFAULT_USER_VALUES = {
  memberships: [],
  location: '',
  isTrainer: false,
  registeredAsTrainer: false,
};

const createDBUser = (authUser: AuthUser) => ({
  id: authUser.email!,
  name: authUser.displayName!,
  photoURL: authUser.photoURL || '',
  registrationDate: Date.now(),
  ...DEFAULT_USER_VALUES,
});

const isTrainerEqual = (a: TrainerContactMembership, b: TrainerContactMembership) => a.trainer.trainerId === b.trainer.trainerId;

const createMembership = (trainer: TrainerContact, membership: MembershipType, trainerGroups: TrainingGroupType[]) => {
  const dbGroups = trainerGroups.filter((group) => membership.groups.includes(group.id) ||
    group.attachedGroups?.some((aid) => membership.groups.includes(aid)));
  return {
    membership,
    dbGroups,
    trainer,
  };
};

// const HACK_USER = 'bodylali.no1@gmail.com';
// const HACK_USER = 'jeva2791@gmail.com';
const HACK_USER = undefined;

const UserProvider = ({ children }: { children: ReactNode }) => {
  const utils = useUtils();

  const [state, setState] = useState<{ initialized: boolean; user: User | undefined }>( { initialized: false, user: undefined });
  const [groupMemberships, setGroupMemberships] = useState<TrainerContactMembership[]>([]);
  const { authUser } = useAuth();

  const userSrv = useFirestore<User>('users');
  const { firestore } = useFirebase();

  const { user, initialized } = state;

  const activeMemberships = useMemo(() => groupMemberships.filter((m) => m.membership.state === MemberState.ACCEPTED), [groupMemberships]);

  const cronConverter = useMemo(() => createCronConverter(utils), [utils]);

  const changeUser = useCallback((newUser: User) => {
    const mergedUser = {
      ...user,
      ...newUser,
    };
    if (!mergedUser.memberships) {
      mergedUser.memberships = [];
    }
    setState({
      initialized: true,
      user: mergedUser,
    });
  }, [user]);

  const loadTrainers = useCallback(() => {
    return userSrv.listAll(where('isTrainer', '==', true));
  },  [userSrv]);

  const saveUser = useCallback((toSave: User) => userSrv.save(toSave).then(() => changeUser(toSave)), [changeUser, userSrv]);

  const userEventProvider = useMemo(() => createUserEventProvider(firestore, activeMemberships), [firestore, activeMemberships]);

  const deleteTrainerContactState = useCallback(async (membership: TrainerContactMembership) => {
    const idx = user!.memberships.findIndex((m) => m.trainerId === membership.trainer.trainerId);
    if (idx >= 0) {
      user!.memberships.splice(idx, 1);
    }
    await userSrv.save(user);
    changeUser(user!);
    await deleteObject(firestore, `trainers/${membership.trainer.trainerId}/members`, membership.membership.id);
    setGroupMemberships((prev) => removeItemByEqual(prev, membership, isTrainerEqual));
  }, [changeUser, firestore, user, userSrv]);

  const getDateRangeStr = useCallback((event: TrainerEvent) => {
    const udate = utils.date(event.startDate);
    return utils.format(udate, 'fullDate') + ' ' + getInterval(event);
  }, [utils]);

  const changeTrainerContactState = useCallback(async (membership: TrainerContactMembership, toState: MemberState | null) => {
    if (!toState) {
      await deleteTrainerContactState(membership);
      return;
    }
    membership.membership.state = toState;
    await setMember(firestore, user!, membership);
    setGroupMemberships((prev) =>
      changeItemByEqual(prev, membership, isTrainerEqual));
  }, [deleteTrainerContactState, firestore, user]);

  const membershipChanged = useCallback(() => {
    setGroupMemberships((prev) => [...prev]);
  }, []);

  const loadMemberships = useCallback((dbUser: User) => {
    if (!dbUser.memberships || dbUser.memberships.length === 0) {
      return;
    }
    Promise.all(
      dbUser.memberships.map(async (trainerContact) => {
        const membership = await loadMembership(firestore, trainerContact.trainerId, dbUser.id) as MembershipType;
        const groups = await loadGroups(firestore, trainerContact.trainerId);
        return createMembership(trainerContact, membership, groups);
      }),
    ).then((memberships) => {
      setGroupMemberships(memberships);
    });
  }, [firestore]);

  const leaveGroup = useCallback((membership: TrainerContactMembership, groupId: string) => {
    const groupIdx = membership.membership.groups.indexOf(groupId);
    membership.membership.groups.splice(groupIdx, 1);
    const idx = membership.dbGroups.findIndex((dg) => dg.id === groupId);
    const group = membership.dbGroups[idx];
    membership.dbGroups.splice(idx, 1);
    return setMember(firestore, user!, membership).then(() => {
      group.attachedGroups.forEach((agroupId) => {
        if (!membership.dbGroups.some((dg) => dg.attachedGroups.includes(agroupId))) {
          const aidx = membership.dbGroups.findIndex((dg) => dg.id === agroupId);
          membership.dbGroups.splice(aidx, 1);
        }
      });
      setGroupMemberships((prev) => changeItemByEqual(prev, membership, isTrainerEqual));
    });
  }, [firestore, user]);

  const addGroupMembership = useCallback((trainer: User, group: TrainingGroupUIType) => {
    if (!user!.memberships.some((m) => m.trainerId === trainer.id)) {
      user!.memberships.push({
        trainerId: trainer.id,
        trainerName: trainer.name,
      });
      saveUser(user!);
    }
    return addUserRequest(firestore, trainer.id, user!, group).then(() => loadMemberships(user!));
  }, [firestore, loadMemberships, saveUser, user]);

  const loadUser = useCallback(() => {
    userSrv.get(HACK_USER || authUser!.email!).then((dbUser) => {
      if (dbUser) {
        if (!dbUser.registrationDate) {
          const toSave = {
            ...createDBUser(authUser!),
            ...dbUser,
          };
          userSrv.save(toSave, true, false).then(() => changeUser(dbUser));
        } else {
          changeUser(dbUser);
          loadMemberships(dbUser);
        }
      } else {
        const toSave = createDBUser(authUser!);
        userSrv.save(toSave, true, false).then(() => {
          changeUser(toSave);
        });
      }
    });
  }, [authUser, changeUser, loadMemberships, userSrv]);

  useEffect(() => {
    // user lost set initialized false
    if (!authUser) {
      setState({
        initialized: false,
        user: undefined,
      });
    }
  }, [authUser]);

  useEffect(() => {
    if (initialized) {
      return;
    }
    // set user initialized state
    if (!authUser) {
      setState({
        initialized: true,
        user: undefined,
      });
      return;
    }
    loadUser();
  }, [authUser, initialized, loadUser, user, userSrv]);

  if (!initialized) {
    return null;
  }

  const ctx = {
    addGroupMembership,
    activeMemberships,
    changeTrainerContactState,
    cronConverter,
    getDateRangeStr,
    groupMemberships,
    loadTrainers,
    leaveGroup,
    membershipChanged,
    saveUser,
    user: user,
    userEventProvider,
    utils,
  };

  if (user && user.isTrainer) {
    return (
      <UserContext.Provider value={ctx}>
        <TrainerProvider>
          { children}
        </TrainerProvider>
      </UserContext.Provider>
    );
  }
  return <UserContext.Provider value={ctx}>{ children}</UserContext.Provider>;
};

const useUser = () => useContext(UserContext);

export { useUser };

export default UserProvider;
