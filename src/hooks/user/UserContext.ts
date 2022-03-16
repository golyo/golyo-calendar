import { createContext } from 'react';
import { MembershipType, MemberState, TrainingGroupType, TrainingGroupUIType } from '../trainer';
import { EventProvider, TrainerEvent } from '../event';
import { MuiPickersAdapter } from '@mui/lab/LocalizationProvider/LocalizationProvider';

export interface UiCronType {
  days: string[];
  time: string;
}

export interface CronConverter {
  toCron: (uiCron: UiCronType) => string;
  toUiCron: (cron: string) => UiCronType;
}

export interface TrainerContact {
  trainerName: string;
  trainerId: string;
}

export interface TrainerGroups {
  isAllGroup?: boolean;
  trainer: TrainerContact;
  dbGroups: TrainingGroupType[];
}

export interface TrainerContactMembership extends TrainerGroups {
  membership: MembershipType;
}

export interface User {
  id: string;
  name: string;
  photoURL: string;
  registeredAsTrainer: boolean;
  isTrainer: boolean;
  location: string;
  registrationDate?: number;
  memberships: TrainerContact[];
}

export interface UserContextType<T> {
  addGroupMembership: (trainer: User, group: TrainingGroupUIType) => Promise<void>;
  activeMemberships: TrainerContactMembership[];
  changeTrainerContactState: (group: TrainerContactMembership, toState: MemberState | null) => Promise<any>;
  cronConverter: CronConverter;
  getDateRangeStr: (event: TrainerEvent) => string;
  groupMemberships: TrainerContactMembership[];
  loadTrainers: () => Promise<User[]>;
  leaveGroup: (membership: TrainerContactMembership, groupId: string) => Promise<void>;
  membershipChanged: () => void;
  saveUser: (user: User) => Promise<any>;
  user?: User;
  userEventProvider: EventProvider;
  utils: MuiPickersAdapter<T>;
}

const UserContext = createContext<UserContextType<any>>({} as UserContextType<any>);

export default UserContext;