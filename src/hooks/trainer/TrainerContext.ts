import { createContext } from 'react';
import { MembershipType, TrainerGroupMemberships, TrainingGroupUIType } from './GroupContext';
import { EventProvider } from '../event';

interface TrainerContextType {
  trainingGroups: TrainerGroupMemberships[];
  eventProvider: EventProvider;
  saveGroup: (modified: TrainingGroupUIType) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  findGroup: (groupId: string) => Promise<TrainingGroupUIType | undefined>;
  sendEmail: (to: string, title: string, message: string) => Promise<any>;
  membershipChanged: (groupId: string, members: MembershipType[]) => void;
}

const TrainerContext = createContext<TrainerContextType>({} as TrainerContextType);

export default TrainerContext;