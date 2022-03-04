import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

export default function BackButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return <>
    <Button variant="outlined" onClick={() => navigate(-1)}>
      {t('common.back')}
    </Button>
  </>;
}