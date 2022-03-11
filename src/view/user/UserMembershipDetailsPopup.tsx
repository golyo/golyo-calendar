import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import ModalContainer from '../common/ModalContainer';
import {
  ActionButton,
  convertGroupToUi,
  getButtonVariant,
  MemberState,
  TrainingGroupType,
  USER_STATE_MAP,
} from '../../hooks/trainer';
import LabelValue from '../common/LabelValue';
import { CronConverter, TrainerContactMembership } from '../../hooks/user';
import GroupDetails from '../trainer/group/GroupDetails';
import { useDialog } from '../../hooks/dialog';

interface Props {
  groupMembership: TrainerContactMembership;
  group: TrainingGroupType,
  cronConverter: CronConverter;
  handleRequest: (member: TrainerContactMembership, toState: MemberState | null) => Promise<void>;
  leaveGroup: (membership: TrainerContactMembership, group: TrainingGroupType) => Promise<void>;
}

const UserMembershipDetailPopup = ({ cronConverter, groupMembership, group, handleRequest, leaveGroup }: Props) => {
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();

  const [open, setOpen] = useState(false);
  const groupUi = useMemo(() => convertGroupToUi(group, cronConverter), [cronConverter, group]);
  const actionButtons = useMemo(() => {
    return USER_STATE_MAP[groupMembership.membership.state || ''];
  }, [groupMembership.membership.state]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const doAction = useCallback((button: ActionButton) => {
    showConfirmDialog({
      description: t(`confirm.setStateByUser.${button.toState || 'null'}`),
      okCallback: () => {
        handleRequest(groupMembership, button.toState);
        closeModal();
      },
    });
  }, [closeModal, groupMembership, handleRequest, showConfirmDialog, t]);

  const canLeave = useMemo(() => {
    const groupIdx = groupMembership.membership.groups.indexOf(group.id);
    return groupIdx >= 0 && groupMembership.membership.groups.length > 1;
  }, [group, groupMembership]);

  const doLeaveGroup = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.leaveGroup'),
      okCallback: () => {
        leaveGroup(groupMembership, group);
        closeModal();
      },
    });
  }, [closeModal, group, groupMembership, leaveGroup, showConfirmDialog, t]);

  return (
    <>
      <IconButton onClick={openModal}>
        <Visibility />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} title={groupMembership.trainer.trainerName}>
          <div className="vertical">
            <LabelValue label={t('membership.trainerEmail')}>
              { groupMembership.trainer.trainerId }
            </LabelValue>
            <LabelValue label={t('membership.groupName')}>
              { group.name }
            </LabelValue>
            <GroupDetails group={groupUi} />
            <LabelValue label={t('membership.state')}>
              {t(`memberState.${groupMembership.membership.state}`)}
            </LabelValue>
            <div className="horizontal">
              {actionButtons.map((button, idx) => (
                <Button key={idx} variant={getButtonVariant(idx)} onClick={() => doAction(button)}>{t(button.label)}</Button>
              ))}
              {canLeave && <Button variant="outlined" onClick={doLeaveGroup}>{t('action.leaveRequest')}</Button>}
              <Button color="primary" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default UserMembershipDetailPopup;