import { TrainingGroupUIType } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import { Avatar } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function GroupDetails({ group }: { group: TrainingGroupUIType }) {
  const { t } = useTranslation();

  return (
    <>
      <LabelValue label={t('trainingGroup.duration')}>
        { group.duration }&nbsp;{t('common.min')}
      </LabelValue>
      <LabelValue label={t('trainingGroup.groupType')}>
        {t(`groupType.${group.groupType}`)}
      </LabelValue>
      <LabelValue label={t('trainingGroup.maxMember')}>
        { group.maxMember }
      </LabelValue>
      <LabelValue label={t('trainingGroup.inviteOnly')}>
        { t(`common.${group.inviteOnly.toString()}`) }
      </LabelValue>
      <LabelValue label={t('trainingGroup.cancellationDeadline')}>
        { group.cancellationDeadline + ' ' + t('common.hour') }
      </LabelValue>
      <LabelValue label={t('trainingGroup.ticketLength')}>
        { group.ticketLength }&nbsp;{t('common.pcs')}
      </LabelValue>
      <LabelValue label={t('trainingGroup.color')}>
        <Avatar sx={{ bgcolor: group.color }}>
          <EventIcon></EventIcon>
        </Avatar>
      </LabelValue>
      <LabelValue label={t('trainingGroup.trainingTime')}>
        {group.crons.map((cron, gidx) => (
          <div key={gidx}>{cron.days.join(',')}&nbsp;&nbsp;{cron.time}</div>
        ))}
      </LabelValue>
    </>
  );
}