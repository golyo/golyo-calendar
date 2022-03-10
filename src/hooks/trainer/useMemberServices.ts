import { useFirestore } from '../firestore/firestore';
import { useCallback, useEffect, useState } from 'react';
import { User, useUser } from '../user';
import { MemberState, useGroup } from './index';
import { MembershipType } from './TrainerContext';
import { UserGroup } from '../user/UserContext';


export const DEFAULT_MEMBER: MembershipType = {
  id: '',
  name: '',
  state: MemberState.TRAINER_REQUEST,
  presenceNo: 0,
  remainingEventNo: 0,
  purchasedTicketNo: 0,
};

const useMemberServices = () => {
  const { group } = useGroup();
  const { user } = useUser();

  const [members, setMembers] = useState<MembershipType[] | undefined>(undefined);

  const memberSrv = useFirestore<MembershipType>(`trainers/${user!.id}/groups/${group!.id}/members`);
  const userSrv = useFirestore<User>('users');

  const loadMemberList = useCallback(() => memberSrv.listAll().then((dbMembers) => {
    if (dbMembers.length > 0) {
      setMembers(dbMembers);
    }
  }), [memberSrv]);

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

  const setUserMemberships = useCallback((userId: string, userGroup: UserGroup) => {
    return userSrv.get(userId).then((dbUser) => {
      const addUser = dbUser || { id: userId, memberships: [] };
      const dbGroupIdx = addUser.memberships.findIndex((dbUserGroup: UserGroup) => dbUserGroup.groupId === userGroup.groupId);
      if (dbGroupIdx < 0) {
        addUser.memberships.push(userGroup);
      } else {
        addUser.memberships[dbGroupIdx] = userGroup;
      }
      userSrv.save(addUser, true, false);
    });
  }, [userSrv]);

  const cancelTrainerRequest = useCallback((requested: MembershipType) => {
    return memberSrv.remove(requested.id).then(() => {
      removeUserMembership(requested.id);
      setMembers((prevMembers) => {
        const idx = prevMembers!.findIndex((m) => m.id === requested.id);
        prevMembers!.splice(idx, 1);
        return [ ...prevMembers! ];
      });
    });
  }, [memberSrv, removeUserMembership]);

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

  useEffect(() => {
    if (members) {
      return;
    }
    loadMemberList();
  }, [members, loadMemberList]);

  return {
    members,
    loadMemberList,
    createTrainerRequest,
    cancelTrainerRequest,
  };
};

export default useMemberServices;