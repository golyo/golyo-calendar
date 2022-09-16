import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@mui/material';
import ModalContainer from '../common/ModalContainer';
import {
  ActionButton,
  convertGroupToUi,
  getButtonVariant,
  MemberState,
  USER_STATE_MAP,
} from '../../hooks/trainer';
import LabelValue from '../common/LabelValue';
import { CronConverter, TrainerContactMembership } from '../../hooks/user';
import PublicGroupData from '../trainer/group/PublicGroupData';
import { useDialog } from '../../hooks/dialog';

interface Props {
  groupMembership?: TrainerContactMembership;
  groupId?: string;
  closeModal: () => void;
  cronConverter: CronConverter;
  handleRequest: (member: TrainerContactMembership, toState: MemberState | null) => Promise<void>;
  leaveGroup: (membership: TrainerContactMembership, groupId: string) => Promise<void>;
}

const UserMembershipDetailPopup = ({ groupMembership, handleRequest, leaveGroup, groupId, closeModal, cronConverter }: Props) => {
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();

  const group = useMemo(() => {
    if (!groupMembership) {
      return undefined;
    }
    return convertGroupToUi(groupMembership?.trainerGroups.find((gr) => gr.id === groupId)!, cronConverter);
  }, [cronConverter, groupId, groupMembership]);

  const actionButtons = useMemo(() => {
    if (!groupMembership) {
      return [];
    }
    return USER_STATE_MAP[groupMembership!.membership.state || ''];
  }, [groupMembership]);

  const doAction = useCallback((button: ActionButton) => {
    showConfirmDialog({
      description: t(`confirm.setStateByUser.${button.toState || 'null'}`),
      okCallback: () => {
        handleRequest(groupMembership!, button.toState);
        closeModal();
      },
    });
  }, [closeModal, groupMembership, handleRequest, showConfirmDialog, t]);

  const canLeave = useMemo(() => {
    if (!groupMembership) {
      return false;
    }
    const groupIdx = groupMembership.membership.groups.indexOf(group!.id);
    return groupIdx >= 0 && groupMembership.membership.groups.length > 1;
  }, [group, groupMembership]);

  const doLeaveGroup = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.leaveGroup'),
      okCallback: () => {
        leaveGroup(groupMembership!, group!.id);
        closeModal();
      },
    });
  }, [closeModal, group, groupMembership, leaveGroup, showConfirmDialog, t]);

  return (
    <>
      <Modal
        open={!!groupMembership}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} open={!!groupMembership} title={groupMembership?.trainer.trainerName}>
          <div className="vertical">
            <LabelValue label={t('membership.trainerEmail')}>
              { groupMembership?.trainer.trainerId }
            </LabelValue>
            <LabelValue label={t('membership.groupName')}>
              { group?.name }
            </LabelValue>
            <PublicGroupData group={group!} />
            <LabelValue label={t('membership.state')}>
              {t(`memberState.${groupMembership?.membership.state}`)}
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