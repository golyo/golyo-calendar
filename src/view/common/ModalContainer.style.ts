import { createStyles } from '@mui/styles';

export default (theme: any) => createStyles({
  root: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    outline: 'none',
    maxHeight: '100vh',
    overflow: 'auto',
    backgroundColor: theme.palette.background.paper,
  },
  modalContent: {
    padding: '15px 20px',
  },
  variantBig: {
    minWidth: 'max(80vw, 320px)',
    maxWidth: '98vw',
  },
  variantSmall: {
    minWidth: '40vw',
    maxWidth: '98vw',
  },
  headerTitle: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
  },
  headerTextContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});
