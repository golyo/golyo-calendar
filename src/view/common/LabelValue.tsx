import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

export const DisplayRow = styled(Paper)(({ theme }) => ({
  ...theme.typography.body1,
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
}));


export const InlineSpan = styled('span')(() => ({
  whiteSpace: 'nowrap',
}));

const LabelValue = ({ label, children }: { label: string, children: React.ReactNode }) => {
  return (
    <DisplayRow>
      <Box sx={{ width: '30%', minWidth: '150px', wordBreak: 'break-word' }}>{label}</Box>
      <Box sx={{ wordBreak: 'break-word' }}>
        {children}
      </Box>
    </DisplayRow>
  );
};

export default LabelValue;