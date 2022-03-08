import { createContext } from 'react';
import { TrainingGroupType, TrainingGroupUIType } from './GroupContext';
import { EventProvider } from '../event';

interface TrainerContextType {
  trainingGroups: TrainingGroupType[];
  eventProvider: EventProvider;
  saveGroup: (modified: TrainingGroupUIType) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  findGroup: (groupId: string) => TrainingGroupUIType | undefined;
  sendEmail: (to: string, title: string, message: string) => Promise<any>;
}

const TrainerContext = createContext<TrainerContextType>({} as TrainerContextType);

export default TrainerContext;