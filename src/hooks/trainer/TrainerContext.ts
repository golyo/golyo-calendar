import { createContext } from 'react';
import { EventProvider, TrainerEvent } from '../event';
import { UiCronType } from '../user';

export enum GroupType {
  PERSONAL = 'PERSONAL',
  GROUP = 'GROUP',
  MASS = 'MASS',
}

export interface TrainerDataType {
  id: string;
  name: string;
  country?: string,
  zipCode?: string,
  address?: string,
}

export enum MemberState {
  ACCEPTED = 'ACCEPTED',
  TRAINER_REQUEST = 'TRAINER_REQUEST',
  USER_REQUEST = 'USER_REQUEST',
  USER_SUSPENDED = 'USER_SUSPENDED',
  TRAINER_SUSPENDED = 'TRAINER_SUSPENDED',
}

export interface ActionButton {
  label: string;
  toState: MemberState | null;
}

export const getButtonVariant = (buttonIdx: number) => buttonIdx === 0 ? 'contained' : 'outlined';

export const USER_STATE_MAP: Record<string, ActionButton[]> = {
  '': [{
    label: 'action.userRequest',
    toState: MemberState.USER_REQUEST,
  }],
  [MemberState.ACCEPTED]: [{
    label: 'action.suspendRequest',
    toState: MemberState.USER_SUSPENDED,
  }],
  [MemberState.USER_REQUEST]: [{
    label: 'action.delete',
    toState: null,
  }],
  [MemberState.TRAINER_REQUEST]: [{
    label: 'action.acceptTrainerRequest',
    toState: MemberState.ACCEPTED,
  }, {
    label: 'action.rejectRequest',
    toState: MemberState.USER_SUSPENDED,
  }],
  [MemberState.TRAINER_SUSPENDED]: [{
    label: 'action.delete',
    toState: null,
  }],
  [MemberState.USER_SUSPENDED]: [{
    label: 'action.returns',
    toState: MemberState.ACCEPTED,
  }, {
    label: 'action.delete',
    toState: null,
  }],
};

export const TRAINER_STATE_MAP: Record<string, ActionButton[]> = {
  '': [{
    label: 'action.trainerRequest',
    toState: MemberState.TRAINER_REQUEST,
  }],
  [MemberState.ACCEPTED]: [{
    label: 'action.suspendRequest',
    toState: MemberState.TRAINER_SUSPENDED,
  }],
  [MemberState.TRAINER_REQUEST]: [{
    label: 'action.delete',
    toState: null,
  }],
  [MemberState.USER_REQUEST]: [{
    label: 'action.acceptUserRequest',
    toState: MemberState.ACCEPTED,
  }, {
    label: 'action.rejectRequest',
    toState: MemberState.TRAINER_SUSPENDED,
  }],
  [MemberState.TRAINER_SUSPENDED]: [{
    label: 'action.acceptUserRequest',
    toState: MemberState.ACCEPTED,
  }, {
    label: 'action.delete',
    toState: null,
  }],
  [MemberState.USER_SUSPENDED]: [{
    label: 'action.delete',
    toState: null,
  }],
};

export interface TicketSheet {
  type: GroupType;
  presenceNo: number;
  remainingEventNo: number;
  purchasedTicketNo: number;
}

export interface MembershipType {
  //email
  id: string;
  name: string;
  avatar?: string;
  state: MemberState;
  groups: string[];
  ticketSheets: TicketSheet[];
}

export const DEFAULT_MEMBER: MembershipType = {
  id: '',
  name: '',
  state: MemberState.TRAINER_REQUEST,
  groups: [],
  ticketSheets: [],
};

export interface TrainingGroupBase {
  id: string;
  name: string;
  groupType: GroupType;
  attachedGroups: string[];
  color?: string;
  inviteOnly: boolean;
  cancellationDeadline: number;
  ticketLength: number;
  duration: number;
  maxMember: number;
}

export interface TrainingGroupUIType extends TrainingGroupBase {
  crons: UiCronType[];
}

export interface TrainingGroupType extends TrainingGroupBase {
  crons: string[];
}

export interface TrainerState {
  trainerData?: TrainerDataType;
  groups: TrainingGroupType[];
  members?: MembershipType[];
}

interface TrainerContextType {
  trainerData: TrainerDataType;
  saveTrainerData: (trainerData: TrainerDataType) => Promise<void>;
  groups: TrainingGroupType[];
  eventProvider: EventProvider;
  members: MembershipType[];

  saveGroup: (modified: TrainingGroupUIType) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  sendEmail: (to: string, title: string, message: string) => Promise<any>;
  membershipChanged: (membership: MembershipType[]) => void;
  updateMembership: (membership: MembershipType) => Promise<void>;

  activateEvent: (toSave: TrainerEvent) => Promise<TrainerEvent>;
  addMemberToEvent: (event: TrainerEvent, member: MembershipType) => Promise<TrainerEvent>;
  buySeasonTicket: (memberId: string, groupId: string) => Promise<MembershipType>;
  createEvent: (group:TrainingGroupType, startDate: Date) => Promise<TrainerEvent>;
  deleteEvent: (toSave: TrainerEvent) => Promise<void>;
  removeMemberFromEvent: (eventId: string, groupType: GroupType, memberId: string, ticketBack: boolean) => Promise<TrainerEvent>;
}

const TrainerContext = createContext<TrainerContextType>({} as TrainerContextType);

export default TrainerContext;