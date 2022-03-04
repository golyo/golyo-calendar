import { styled } from '@mui/system';

interface ModalContainerProps {
  variant?: 'small' | 'big';
}

const ModalContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'variant',
  name: 'ModalContainer',
  slot: 'Root',
})<ModalContainerProps>(({ theme }) => ({
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  outline:'none',
  backgroundColor: theme.palette.background.paper,
  border: `3px solid ${theme.palette.grey[500]}`,
  borderRadius: 20,
  padding: 20,
}));

export default ModalContainer;