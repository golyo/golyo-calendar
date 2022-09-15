export interface CalendarEvent {
  id: string;
  title: string;
  text: string;
  isDeleted?: boolean;
  badge?: string;
  startDate: Date;
  endDate: Date;
  checked?: boolean;
  color?: string;
}

export interface TrainerEvent extends CalendarEvent {
  deletable?: boolean;
  trainerId: string;
  groupId: string;
  showMembers: boolean;
  memberIds: string[];
  memberNames: string[];
}

export interface EventProvider {
  getEvents: (from: Date, to: Date) => Promise<TrainerEvent[]>;
  setGroupRestriction: (groupId: string | undefined) => void;
}
