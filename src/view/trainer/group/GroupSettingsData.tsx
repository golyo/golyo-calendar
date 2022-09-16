import { TrainingGroupType, TrainingGroupUIType } from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import { useTranslation } from 'react-i18next';

const GroupSettingsData = ({ group, attachedGroups }: { group: TrainingGroupUIType, attachedGroups: TrainingGroupType[] }) => {
  const { t } = useTranslation();

  return (
    <>
      <LabelValue label={t('trainingGroup.cancellationDeadline')}>
        { group.cancellationDeadline + ' ' + t('common.hour') }
      </LabelValue>
      <LabelValue label={t('trainingGroup.ticketLength')}>
        { group.ticketLength }&nbsp;{t('common.pcs')}
      </LabelValue>
      <LabelValue label={t('trainingGroup.ticketValidity')}>
        { group.ticketValidity ? group.ticketValidity + ' ' + t('common.month') : t('common.unlimited') }
      </LabelValue>
      <LabelValue label={t('trainingGroup.inviteOnly')}>
        { t(`common.${group.inviteOnly.toString()}`) }
      </LabelValue>
      <LabelValue label={t('trainingGroup.showMembers')}>
        {t(group.showMembers ? 'common.yes' : 'common.no')}
      </LabelValue>
      <LabelValue label={t('trainingGroup.attachedGroups')}>
        {attachedGroups.map((agroup, idx) => (
          <div key={idx}>{agroup.name}</div>
        ))}
      </LabelValue>
    </>
  );
};

export default GroupSettingsData;
