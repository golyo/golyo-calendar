import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import TrainerContext from './TrainerContext';
import { useUser } from '../user';
import { MembershipType, TrainerGroupMemberships, TrainingGroupType, TrainingGroupUIType } from './GroupContext';
import { changeItem, doQuery, insertObject, useFirestore } from '../firestore/firestore';
import { createTrainerEventProvider } from '../event/eventUtil';
import { useFirebase } from '../firebase';
import { convertGroupToFirestore, convertGroupToUi } from './GroupProvider';

const initGroup = (group: TrainingGroupType) => {
  group.cancellationDeadline = group.cancellationDeadline || 0;
  return group;
};

const TrainerProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, cronConverter } = useUser();
  const groupSrv = useFirestore<TrainingGroupType>('trainers/' + user?.id + '/groups');

  const [trainingGroups, setTrainingGroups] = useState<TrainerGroupMemberships[]>([]);

  const eventProvider = useMemo(() => createTrainerEventProvider(firestore, user!, trainingGroups), [firestore, trainingGroups, user]);

  const membershipChanged = useCallback((groupId: string, members: MembershipType[]) => {
    setTrainingGroups((prev) => {
      const group = prev.find((gr) => gr.id === groupId)!;
      group.members = members;
      return changeItem(prev, group);
    });
  }, []);

  const saveGroup = useCallback((modifiedUi: TrainingGroupUIType) => {
    const modified = convertGroupToFirestore(modifiedUi, cronConverter);
    const { members, ...modifiedToDb } = modified;
    return groupSrv.save(modifiedToDb).then(() => {
      // set id, if new
      modified.id = modifiedToDb.id;
      setTrainingGroups((prev) => changeItem(prev, modified));
    });
  }, [cronConverter, groupSrv]);

  const sendEmail = useCallback((to: string, subject: string, html: string) => {
    const mail = {
      id: undefined,
      to,
      message: {
        subject: subject,
        html: html,
      },
    };
    const mail2 = {
      id: undefined,
      to,
      template: {
        name: 'invite',
        data: {
          username: 'ada',
          name: 'Ada Lovelace',
        },
      },
    };

    const toSend = true ? mail2 : mail;
    return insertObject(firestore, 'mail', toSend);
  }, [firestore]);

  const deleteGroup = useCallback((groupId: string) => groupSrv.remove(groupId).then(() => {
    setTrainingGroups((prev) => {
      const idx = prev.findIndex((group) => group.id === groupId);
      prev.splice(idx, 1);
      return [...prev];
    });
  }), [groupSrv]);

  const loadMembers = useCallback((groupId) => {
    return doQuery(firestore, `trainers/${user?.id}/groups/${groupId}/members`);
  }, [firestore, user?.id]);

  const findGroup = useCallback((groupId) => {
    const dbGroup = trainingGroups.find((group) => group.id === groupId);
    if (!dbGroup) {
      return Promise.resolve(undefined);
    }
    if (!dbGroup.members) {
      loadMembers(groupId).then((members) => {
        dbGroup.members = members;
        // this setter will trigger the membership loaded result
        setTrainingGroups((prev) => changeItem(prev, dbGroup));
      });
      return Promise.resolve(undefined);
    }
    return Promise.resolve(convertGroupToUi(dbGroup!, cronConverter));
  }, [cronConverter, loadMembers, trainingGroups]);

  const ctx = {
    trainingGroups,
    eventProvider,
    saveGroup,
    deleteGroup,
    findGroup,
    sendEmail,
    membershipChanged,
  };

  useEffect(() => {
    groupSrv.listAll().then((groups) => setTrainingGroups(groups.map((group) => initGroup(group))));
  }, [groupSrv]);

  return <TrainerContext.Provider value={ctx}>{ children}</TrainerContext.Provider>;
};

const useTrainer = () => useContext(TrainerContext);

export { useTrainer };

export default TrainerProvider;