import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import TrainerContext from './TrainerContext';
import { useUser } from '../user';
import { TrainingGroupType, TrainingGroupUIType } from './GroupContext';
import { useFirestore } from '../firestore/firestore';
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
  const groupSrv = useFirestore<TrainingGroupType>('users/' + user?.id + '/groups');

  const [trainingGroups, setTrainingGroups] = useState<TrainingGroupType[]>([]);

  const eventProvider = useMemo(() => createTrainerEventProvider(firestore, user!, trainingGroups), [firestore, trainingGroups, user]);

  const saveGroup = useCallback((modifiedUi: TrainingGroupUIType) => {
    const modified = convertGroupToFirestore(modifiedUi, cronConverter);
    return groupSrv.save(modified).then(() => {
      setTrainingGroups((prev) => {
        const idx = prev.findIndex((group) => group.id === modified.id);
        if (idx >= 0) {
          prev[idx] = modified;
        } else {
          prev.push(modified);
        }
        return [...prev];
      });
    });
  }, [cronConverter, groupSrv]);

  const deleteGroup = useCallback((groupId: string) => groupSrv.remove(groupId).then(() => {
    setTrainingGroups((prev) => {
      const idx = prev.findIndex((group) => group.id === groupId);
      prev.splice(idx, 1);
      return [...prev];
    });
  }), [groupSrv]);

  const findGroup = useCallback((groupId) => {
    const dbGroup = trainingGroups.find((group) => group.id === groupId);
    return dbGroup ? convertGroupToUi(dbGroup, cronConverter) : undefined;
  }, [cronConverter, trainingGroups]);

  const ctx = useMemo(() => ({
    trainingGroups,
    eventProvider,
    saveGroup,
    deleteGroup,
    findGroup,
  }), [deleteGroup, findGroup, trainingGroups, eventProvider, saveGroup]);

  useEffect(() => {
    groupSrv.listAll().then((groups) => setTrainingGroups(groups.map((group) => initGroup(group))));
  }, [groupSrv]);

  return <TrainerContext.Provider value={ctx}>{ children}</TrainerContext.Provider>;
};

const useTrainer = () => useContext(TrainerContext);

export { useTrainer };

export default TrainerProvider;