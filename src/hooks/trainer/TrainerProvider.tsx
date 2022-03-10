import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import TrainerContext, {
  MembershipType,
  TrainerDataType,
  TrainingGroupType, TrainingGroupUIType,
} from './TrainerContext';
import { useUser } from '../user';
import { changeItem, insertObject, removeItemById, useFirestore } from '../firestore/firestore';
import { createTrainerEventProvider } from '../event/eventUtil';
import { useFirebase } from '../firebase';
import { convertGroupToFirestore } from './GroupProvider';

interface TrainerState {
  trainerData?: TrainerDataType;
  groups?: TrainingGroupType[];
  members?: MembershipType[];
}

const TrainerProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, cronConverter } = useUser();

  const [state, setState] = useState<TrainerState>({});

  const trainerSrv = useFirestore<TrainerDataType>('trainers');
  const groupSrv = useFirestore<TrainingGroupType>('trainers/' + user!.id + '/groups');
  const memberSrv = useFirestore<MembershipType>('trainers/' + user!.id + '/members');

  const { groups, trainerData, members } = state;

  const eventProvider = useMemo(() => groups ? createTrainerEventProvider(firestore, user!, groups) : undefined, [firestore, groups, user]);

  const membershipChanged = useCallback((memberships: MembershipType[]) => setState((prev) => ({
    trainerData: prev.trainerData,
    groups: prev.groups,
    members: memberships,
  })), []);

  const saveGroup = useCallback((modifiedUi: TrainingGroupUIType) => {
    const modified = convertGroupToFirestore(modifiedUi, cronConverter);
    return groupSrv.save(modified).then(() => setState((prev) => ({
      trainerData: prev.trainerData,
      groups: changeItem(prev.groups!, modified),
      members: prev.members,
    })));
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

  const deleteGroup = useCallback((groupId: string) => groupSrv.remove(groupId).then(() => setState((prev) => ({
    trainerData: prev.trainerData,
    groups: removeItemById(prev.groups!, groupId),
    members: prev.members,
  }))), [groupSrv]);

  const saveTrainerData = useCallback((modified: TrainerDataType) => trainerSrv.save(modified).then(() => setState((prev) => ({
    trainerData: modified,
    members: prev.members,
    groups: prev.groups,
  }))), [trainerSrv]);

  const loadTrainerState = useCallback(() => {
    if (!user) {
      return;
    }
    Promise.all([trainerSrv.get(user!.id), memberSrv.listAll(), groupSrv.listAll()]).then((objects) => {
      setState({
        trainerData: objects[0],
        members: objects[1],
        groups: objects[2],
      });
    });
  }, [groupSrv, memberSrv, trainerSrv, user]);

  useEffect(() => {
    loadTrainerState();
  }, [loadTrainerState]);

  if (!trainerData) {
    return null;
  }

  const ctx = {
    trainerData,
    groups: groups!,
    members: members!,
    eventProvider: eventProvider!,
    saveGroup,
    saveTrainerData,
    deleteGroup,
    sendEmail,
    membershipChanged,
  };

  return <TrainerContext.Provider value={ctx}>{ children}</TrainerContext.Provider>;
};

const useTrainer = () => useContext(TrainerContext);

export { useTrainer };

export default TrainerProvider;