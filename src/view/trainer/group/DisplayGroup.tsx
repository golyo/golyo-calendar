import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import { Delete, Edit, ExpandMore } from '@mui/icons-material';


import { useDialog } from '../../../hooks/dialog';
import { useGroup, useTrainer } from '../../../hooks/trainer';

import { Accordion, AccordionDetails, AccordionSummary } from '../../common/ZhAccordion';
import EditGroupPopup from './EditGroupPopup';
import PublicGroupData from './PublicGroupData';
import GroupSettingsData from './GroupSettingsData';

export default function DisplayGroup() {
  const { t } = useTranslation();
  const { showConfirmDialog, showDialog } = useDialog();
  const [showPublic, setShowPublic] = useState<boolean>(true);
  const navigate = useNavigate();
  const { attachedGroups, group } = useGroup();
  const { members, saveGroup, deleteGroup } = useTrainer();

  const [edit, setEdit] = useState<boolean>(false);

  const closePopup = useCallback(() => setEdit(false), []);
  const openPopup = useCallback(() => setEdit(true), []);

  const toggleAccordion = useCallback(() => setShowPublic((prev) => !prev), []);

  const doDelete = useCallback(() => {
    if (members.length > 0) {
      showDialog({
        title: 'common.warning',
        description: 'warning.deleteGroup',
      });
      return;
    }
    showConfirmDialog({
      description: 'trainingGroup.deleteConfirm',
      okCallback: () => {
        navigate('/groups');
        deleteGroup(group!.id);
      },
    });
  }, [deleteGroup, group, members.length, navigate, showConfirmDialog, showDialog]);

  if (!group) {
    return null;
  }

  return (
    <>
      <div>
        <Accordion disableGutters expanded={showPublic} onChange={toggleAccordion}>
          <AccordionSummary expandIcon={<ExpandMore />} >
            <Typography>{t('trainer.groupPublic')}</Typography>
          </AccordionSummary>
          <AccordionDetails className="vertical">
            <PublicGroupData group={group} />
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters expanded={!showPublic} onChange={toggleAccordion}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>{t('trainer.groupSettings')}</Typography>
          </AccordionSummary>
          <AccordionDetails className="vertical">
            <GroupSettingsData group={group} attachedGroups={attachedGroups} />
          </AccordionDetails>
        </Accordion>
      </div>

      <div className="horizontal">
        <Button onClick={openPopup} variant="contained" startIcon={<Edit />}>{t('common.modify')}</Button>
        <Button onClick={doDelete} variant="contained" startIcon={<Delete />}>{t('common.delete')}</Button>
      </div>

      <EditGroupPopup trainingGroup={group} closePopup={closePopup} isOpen={edit} saveGroup={saveGroup} />
    </>
  );
}