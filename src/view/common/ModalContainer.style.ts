import { createStyles } from '@mui/styles';

export default (theme: any) => createStyles({
  outer: {
    position: 'absolute' as 'absolute',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
  },
  root: {
    outline: 'none',
    maxHeight: '100vh',
    overflow: 'auto',
    alignSelf: 'center',
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
