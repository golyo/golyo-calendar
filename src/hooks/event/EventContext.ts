export interface CalendarEvent {
  id: string;
  title: string;
  text: string;
  isDeleted?: boolean;
  badge?: string;
  startDate: Date;
  endDate: Date;
  color?: string;
}

export interface EventMember {
  id: string;
  name: string;
}

export interface TrainerEvent extends CalendarEvent {
  deletable?: boolean;
  trainerId: string;
  groupId: string;
  members: EventMember[];
}

export interface EventProvider {
  getEvents: (from: Date, to: Date) => Promise<TrainerEvent[]>;
  setGroupRestriction: (groupId: string | undefined) => void;
}
