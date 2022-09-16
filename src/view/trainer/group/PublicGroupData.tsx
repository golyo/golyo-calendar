import { TrainingGroupUIType } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import { Avatar } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const PublicGroupData = ({ group }: { group: TrainingGroupUIType }) => {
  const { t } = useTranslation();

  return (
    <>
      <LabelValue label={t('trainingGroup.groupType')}>
        {t(`groupType.${group.groupType}`)}
      </LabelValue>
      <LabelValue label={t('trainingGroup.duration')}>
        { group.duration }&nbsp;{t('common.min')}
      </LabelValue>
      <LabelValue label={t('trainingGroup.maxMember')}>
        { group.maxMember }
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
};

export default PublicGroupData;
