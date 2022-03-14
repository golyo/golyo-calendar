import { makeStyles } from '@mui/styles';
import styles from './ModalContainer.style';
import { useMemo } from 'react';
import classNames from 'classnames';
import Typography from '@mui/material/Typography';
import { AppBar, Box, Grow, IconButton, Toolbar } from '@mui/material';
import { Close } from '@mui/icons-material';
import * as React from 'react';

const useStyles = makeStyles(styles, { name: 'ModalContainer2' });

interface ModalProps {
  children : React.ReactNode;
  title: React.ReactNode;
  open: boolean;
  variant?: 'big' | 'small';
  close: () => void;
}

const ModalContainer = React.forwardRef<HTMLDivElement, ModalProps>(({ children, variant, title, close, open }, ref) => {
  const classes = useStyles();

  const appendRootClass = useMemo(() => {
    return variant === 'big' ? classes.variantBig : variant === 'small' ? classes.variantSmall : undefined;
  }, [classes.variantBig, classes.variantSmall, variant]);

  return (
    <Grow in={open} timeout={1000}>
      <Box className={classes.outer}>
        <Box tabIndex={-1} className={classNames(classes.root, appendRootClass)} ref={ref}>
          <AppBar position="relative">
            <Toolbar className={classes.headerTextContainer}>
              <Typography variant="h4" color="inherit" component="div" className={classes.headerTitle}>
                { title }
              </Typography>
              <IconButton onClick={close} edge="end" size="large" color="inherit">
                <Close></Close>
              </IconButton>
            </Toolbar>
          </AppBar>
          <div className={classes.modalContent}>
            {children}
          </div>
        </Box>
      </Box>
    </Grow>
  );
});

export default ModalContainer;