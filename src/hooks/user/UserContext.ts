import { createContext } from 'react';
import { MemberState, MembershipType } from '../trainer';
import { TrainingGroupType } from '../trainer/GroupContext';
import { EventProvider, TrainerEvent } from '../event';
import { IUtils } from '@date-io/core/IUtils';

export interface UiCronType {
  days: string[];
  time: string;
}

export interface CronConverter {
  toCron: (uiCron: UiCronType) => string;
  toUiCron: (cron: string) => UiCronType;
}

export interface UserGroup {
  trainerName: string;
  trainerId: string;
  groupId: string;
}

export interface UserGroupMembership extends UserGroup {
  group: TrainingGroupType;
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
  memberships: UserGroup[];
}

export interface UserContextType {
  user?: User;
  utils: IUtils<any>;
  cronConverter: CronConverter;
  userEventProvider: EventProvider;
  groupMemberships: UserGroupMembership[];
  activeMemberships: UserGroupMembership[];
  getDateRangeStr: (event: TrainerEvent) => string;
  membershipChanged: () => void;
  saveUser: (user: User) => Promise<any>;
  changeUserGroupState: (group: UserGroupMembership, toState: MemberState | null) => Promise<any>;
}

const UserContext = createContext<UserContextType>({} as UserContextType);

export default UserContext;