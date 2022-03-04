import { useCallback, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
  Autocomplete, Box, IconButton,
  TextField,
} from '@mui/material';
import { useUtils } from '@mui/lab/internal/pickers/hooks/useUtils';
import { AddCircle, Delete } from '@mui/icons-material';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const resolve = (path: string, obj: any, separator = '.') => {
  const properties = Array.isArray(path) ? path : path.split(separator);
  // @ts-ignore
  return properties.reduce((prev: any, curr: any) => prev && prev[curr], obj);
};

interface CronWeekPickerProps {
  control: any;
  setValue: any;
  errors: any;
  trigger: any;
  name: string;
  onDelete: (() => void) | undefined;
  onAdd: (() => void) | undefined;
}

const CronWeekPicker = ({ control, setValue, trigger, errors, name, onDelete, onAdd }: CronWeekPickerProps) => {
  const { t } = useTranslation();
  const utils = useUtils();

  const weekDays = useMemo(() => utils.getWeekdays(), [utils]);

  const autoName = `${name}.days`;

  const cronErrors = resolve(name, errors);

  const checkCanAdd = useCallback(async () => {
    const canAdd = await trigger([`${name}.days`, `${name}.time`]);
    if (canAdd) {
      onAdd!();
    }
  }, [name, onAdd, trigger]);

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Controller
        control={control}
        name={autoName}
        render={({ field }) =>
          <Autocomplete
            {...field}
            multiple
            size="small"
            id="tags-standard"
            sx={{ width: '100%' }}
            value={field.value || []}
            options={weekDays}
            onChange={(e, values) => setValue(autoName, values)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('trainingGroup.days')}
                placeholder="Nap"
                error={!!cronErrors?.days}
                helperText={cronErrors?.days?.message}
              />
            )}
          />
        }
      />
      <Controller
        control={control}
        name={`${name}.time`}
        render={({ field }) =>
          <TextField
            {...field}
            size="small"
            label={t('trainingGroup.time')}
            type="time"
            value={field.value || ''}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            sx={{ minWidth: 110 }}
            error={!!cronErrors?.time}
          />
        }
      />
      <Box sx={{ width: '40px' }}>
        { onDelete && <IconButton size="small" onClick={onDelete} color="warning">
          <Delete></Delete>
        </IconButton> }
        { onAdd && <IconButton size="small" onClick={checkCanAdd} color="secondary">
          <AddCircle></AddCircle>
        </IconButton> }
      </Box>
    </Box>
  );
};

export default CronWeekPicker;