import { createStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const drawerWidth = 200;

const STYLE = (theme: Theme) => createStyles({
  root: {
    display: 'flex',
    minWidth: '320px',
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 36,
  },
  menuButtonIconClosed: {
    transition: theme.transitions.create(['transform'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    transform: 'rotate(0deg)',
  },
  menuButtonIconOpen: {
    transition: theme.transitions.create(['transform'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    transform: 'rotate(180deg)',
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    zIndex: theme.zIndex.appBar - 1,
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create(['width', 'transform'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create(['width', 'transform'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    width: '100vw',
  },
  grow: {
    flexGrow: 1,
  },
  container: {
    padding: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(5),
    },
  },
  menuHorizontal: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
  },
  avatarButton: {
    maxWidth: 120,
  },
});

export default STYLE;
