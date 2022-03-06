import { createContext } from 'react';
import { UiCronType } from '../user';
import { TrainerEvent } from '../event';

interface TrainingGroupBase {
  id: string;
  name: string;
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
    label: 'action.leaveRequest',
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

export interface MembershipType {
  //email
  id: string;
  name: string;
  avatar?: string;
  state: MemberState;
  presenceNo: number;
  remainingEventNo: number;
  purchasedTicketNo: number;
}

interface GroupContextType {
  buySeasonTicket: (memberId: string) => Promise<MembershipType>,
  loadEvent: (eventId: string) => Promise<TrainerEvent>,
  removeMemberFromEvent: (eventId: string, memberId: string, ticketBack: boolean) => Promise<TrainerEvent>,
  group: TrainingGroupUIType | undefined,
  members: MembershipType[],
  updateMembership: (membership: MembershipType) => Promise<void>
  updateMembershipState: (membership: MembershipType, toState: MemberState | null) => Promise<any>;
}

const GroupContext = createContext<GroupContextType>({} as GroupContextType);

export default GroupContext;