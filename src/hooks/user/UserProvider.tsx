import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { User as AuthUser } from 'firebase/auth';

import {
  changeItemByEqual,
  deleteObject,
  loadObject,
  removeItemByEqual,
  updateObject,
  useFirestore,
} from '../firestore/firestore';
import { useAuth } from '../auth/AuthProvider';
import UserContext, { User, UserGroupMembership } from './UserContext';
import { useFirebase } from '../firebase';
import { MembershipType, MemberState, TrainingGroupType } from '../trainer/GroupContext';
import { Firestore, where } from 'firebase/firestore';
import { TrainerProvider } from '../trainer';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { createCronConverter } from './cronUtils';
import { createUserEventProvider, getInterval, TrainerEvent } from '../event';

export const loadGroup = (firestore: Firestore, trainerId: string, groupId: string) =>
  loadObject(firestore, `users/${trainerId}/groups`, groupId);

export const loadMembership = (firestore: Firestore, trainerId: string, groupId: string, userId: string) =>
  loadObject(firestore, `users/${trainerId}/groups/${groupId}/members`, userId);

const setMember = (firestore: Firestore, user: User, membership: UserGroupMembership) => {
  const member: MembershipType = {
    ...membership.membership,
    id: user.id,
    name: user.name,
    avatar: user.photoURL,
  };
  return updateObject(firestore, `users/${membership.trainerId}/groups/${membership.groupId}/members`, member);
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

const userGroupEqual = (a: UserGroupMembership, b: UserGroupMembership) => a.trainerId === b.trainerId && a.groupId === b.groupId;

const UserProvider = ({ children }: { children: ReactNode }) => {
  const utils = useUtils();

  const [state, setState] = useState<{ initialized: boolean; user: User | undefined }>( { initialized: false, user: undefined });
  const [groupMemberships, setGroupMemberships] = useState<UserGroupMembership[]>([]);
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

  const deleteUserGroupState = useCallback(async (userGroup: UserGroupMembership) => {
    const idx = user!.memberships.findIndex((m) => m.trainerId === userGroup.trainerId && m.groupId === userGroup.groupId);
    if (idx >= 0) {
      user!.memberships.splice(idx, 1);
    }
    await userSrv.save(user);
    changeUser(user!);
    await deleteObject(firestore, `users/${userGroup.trainerId}/groups/${userGroup.groupId}/members`, user!.id);
    setGroupMemberships((prev) => removeItemByEqual(prev, userGroup, userGroupEqual));
  }, [changeUser, firestore, user, userSrv]);

  const getDateRangeStr = useCallback((event: TrainerEvent) => {
    const udate = utils.date(event.startDate);
    return utils.format(udate, 'fullDate') + ' ' + getInterval(event);
  }, [utils]);

  const changeUserGroupState = useCallback(async (userGroup: UserGroupMembership, toState: MemberState | null) => {
    if (!toState) {
      await deleteUserGroupState(userGroup);
      return;
    }
    userGroup.membership.state = toState;
    await setMember(firestore, user!, userGroup);
    setGroupMemberships((prev) =>
      changeItemByEqual(prev, userGroup, userGroupEqual));
  }, [deleteUserGroupState, firestore, user]);

  const membershipChanged = useCallback(() => {
    setGroupMemberships((prev) => [...prev]);
  }, []);

  const loadMemberships = useCallback((dbUser: User) => {
    if (!dbUser.memberships || dbUser.memberships.length === 0) {
      return;
    }
    Promise.all(
      dbUser.memberships.map(async (userGroup) => {
        const group = await loadGroup(firestore, userGroup.trainerId, userGroup.groupId) as TrainingGroupType;
        const membership = await loadMembership(firestore, userGroup.trainerId, userGroup.groupId, dbUser.id) as MembershipType;
        const userGroupMembersip: UserGroupMembership = {
          ...userGroup,
          group,
          membership,
        };
        return userGroupMembersip;
      }),
    ).then((userGroups) => {
      setGroupMemberships(userGroups);
    });
  }, [firestore]);

  const addGroupMembership = useCallback((trainer: User, groupId: string) => {
    user!.memberships = user!.memberships || [];
    user!.memberships.push({
      trainerId: trainer.id,
      trainerName: trainer.name,
      groupId,
    });
    return saveUser(user!);
  }, [saveUser, user]);

  const loadUser = useCallback(() => {
    userSrv.get(authUser!.email!).then((dbUser) => {
      if (dbUser) {
        if (!dbUser.registrationDate) {
          const toSave = createDBUser(authUser!);
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
    changeUserGroupState,
    cronConverter,
    getDateRangeStr,
    groupMemberships,
    loadTrainers,
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
