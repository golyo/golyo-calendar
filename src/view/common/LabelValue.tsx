import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const DisplayRow = styled.div`
  padding: ${props => (props.theme as any).spacing(1)};
  color: black;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export const InlineSpan = styled.span`
  white-space: nowrap;
`;

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