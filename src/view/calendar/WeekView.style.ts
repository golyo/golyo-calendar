import { createStyles } from '@mui/styles';
import { alpha, darken, lighten } from '@mui/system';
import { Breakpoints } from '../../hooks/breakpoint';

const breakpointLineHeightMap: Record<Breakpoints, number> = {
  xs: 40,
  sm: 50,
  md: 60,
  lg: 60,
};

const STYLE = (theme: any) => {
  return createStyles({
    root: {
      // because of chip
      paddingBottom: '20px',
    },
    headerNavigation: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLabel: {
      [theme.breakpoints.up('xs')]: {
        display: 'none',
      },
      [theme.breakpoints.up('sm')]: {
        display: 'inline',
      },
    },
    weekCell: {
      '&.MuiTableCell-root' : {
        padding: 0,
        overflow: 'visible',
        position: 'relative',
        [theme.breakpoints.up('xs')]: {
          fontSize: '0.56rem',
          lineHeight: 1.2,
          height: breakpointLineHeightMap.xs,
        },
        [theme.breakpoints.up('sm')]: {
          fontSize: '0.75rem',
          lineHeight: 1.4,
          height: breakpointLineHeightMap.sm,
        },
        [theme.breakpoints.up('md')]: {
          fontSize: '1rem',
          lineHeight: 1.6,
          height: breakpointLineHeightMap.md,
        },
        borderRight: `1px solid ${theme.palette.mode === 'light' ? lighten(alpha(theme.palette.divider, 1), 0.88) : darken(alpha(theme.palette.divider, 1), 0.68)}`,
      },
    },
    headerContent: {
      textAlign: 'center',
      height: '100%',
      backgroundColor: theme.palette.weekPalette.headerBGColor || theme.palette.primary.main,
      color: theme.palette.weekPalette.headerTextColor || theme.palette.primary.contrastText,
      padding: 4,
    },
    eventContent: {
      margin: '2px',
      padding: '2px',
      position: 'absolute',
      width: 'calc(100% - 4px);',
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'block',
      zIndex: 2,
      textAlign: 'center',
      borderRadius: 8,
    },
    chipContent: {
      height: '100%',
    },
    timeChip: {
      '&.MuiChip-root': {
        position: 'relative',
        fontSize: '0.56rem',
        [theme.breakpoints.up('xs')]: {
          top: '28px',
        },
        [theme.breakpoints.up('sm')]: {
          top: '38px',
        },
        [theme.breakpoints.up('md')]: {
          top: '46px',
        },
      },
    },
  });
};

export { breakpointLineHeightMap };

export default STYLE;
