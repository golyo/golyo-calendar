import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Avatar, Button, Checkbox, FormControlLabel, InputAdornment, MenuItem, TextField } from '@mui/material';
import Modal from '@mui/material/Modal';
import { TrainingGroupUIType } from '../../../hooks/trainer';
import CronWeekPicker from '../../common/CronWeekPicker';
import { EVENT_COLORS } from '../../../theme/weekTableTheme';
import ModalContainer from '../../common/ModalContainer';

interface ModalTitleProps {
  trainingGroup: TrainingGroupUIType;
  isOpen: boolean;
  closePopup: () => void;
  saveGroup: (group: TrainingGroupUIType) => Promise<void>;
}

const EditGroupPopup = ({ trainingGroup, isOpen, closePopup, saveGroup } : ModalTitleProps) => {
  const { t } = useTranslation();

  const schema = useMemo(() => yup.object({
    name: yup.string().required(),
    color: yup.string().required(),
    inviteOnly: yup.boolean().required(),
    duration: yup.number().integer().min(1).max(24 * 60),
    cancellationDeadline: yup.number().integer().min(0).max(120),
    ticketLength: yup.number().integer().min(1).max(100),
    maxMember: yup.number().integer().min(1).max(100),
    crons: yup.array().of(
      yup.object().shape({
        days: yup.array().of(yup.string()).min(1, t('error.required')),
        time: yup.string().required(),
      }),
    ),
  }), [t]);

  const { handleSubmit, control, setValue, reset, trigger, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'crons',
  });

  useEffect(() => {
    reset(trainingGroup);
  }, [reset, trainingGroup]);

  const modifyData = useCallback((modifiedGroup) => {
    const toSave = {
      ...trainingGroup,
      ...modifiedGroup,
    };
    saveGroup(toSave);
    closePopup();
  }, [closePopup, saveGroup, trainingGroup]);

  if (!trainingGroup) {
    return null;
  }

  return (
    <Modal
      open={!!isOpen}
      onClose={closePopup}
    >
      <ModalContainer variant="big" title={t('trainingGroup.title')} close={closePopup}>
        <form onSubmit={handleSubmit(modifyData)} className="vertical">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('trainingGroup.name')}
                size="small"
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="duration"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('trainingGroup.duration')}
                size="small"
                variant="outlined"
                error={!!errors.duration}
                helperText={errors.duration?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Avatar variant="square">{t('common.min')}</Avatar>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="maxMember"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('trainingGroup.maxMember')}
                size="small"
                variant="outlined"
                error={!!errors.maxMember}
                helperText={errors.maxMember?.message}
              />
            )}
          />
          <FormControlLabel
            control={
              <Controller
                name="inviteOnly"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    checked={field.value}
                  />
                )}
              />
            }
            label={t('trainingGroup.inviteOnly') as string}
          />
          <Controller
            control={control}
            name="cancellationDeadline"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('trainingGroup.cancellationDeadline')}
                size="small"
                variant="outlined"
                error={!!errors.cancellationDeadline}
                helperText={errors.cancellationDeadline?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Avatar variant="square">{t('common.hour')}</Avatar>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="ticketLength"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('trainingGroup.ticketLength')}
                size="small"
                variant="outlined"
                error={!!errors.ticketLength}
                helperText={errors.ticketLength?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Avatar variant="square">{t('common.pcs')}</Avatar>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label={t('trainingGroup.color')}
                size="small"
                variant="outlined"
                sx={{ backgroundColor: field.value }}
                error={!!errors.color}
                helperText={errors.color?.message}
              >
                <MenuItem value=''>-</MenuItem>)
                {EVENT_COLORS.map((color, idx) =>
                  (<MenuItem key={idx} sx={{
                    'backgroundColor': color,
                    '&:hover': {
                      backgroundColor: color,
                    },
                  }} value={color}>{color}</MenuItem>),
                )}
              </TextField>
            )}
          />
          {fields.map((item, index) => (
            <div key={index}>
              <CronWeekPicker
                control={control}
                setValue={setValue}
                errors={errors}
                trigger={trigger}
                name={`crons.${index}`}
                onDelete={index > 0 ? () => remove(index) : undefined}
                onAdd={fields.length - 1 === index ? () => append({ days: [], time: '' }) : undefined}
              />
            </div>
          ))}
          <div>
            <Button color="primary" type="submit" variant="contained">
              {t('common.save')}
            </Button>
            <Button color="primary" onClick={closePopup}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </ModalContainer>
    </Modal>

  );
};

export default EditGroupPopup;
