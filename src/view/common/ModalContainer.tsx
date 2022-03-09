import { makeStyles } from '@mui/styles';
import styles from './ModalContainer.style';
import { useMemo } from 'react';
import classNames from 'classnames';
import Typography from '@mui/material/Typography';
import { AppBar, IconButton, Toolbar } from '@mui/material';
import { Close } from '@mui/icons-material';
import * as React from 'react';

const useStyles = makeStyles(styles, { name: 'ModalContainer2' });

interface ModalProps {
  children : React.ReactNode;
  title: React.ReactNode;
  variant?: 'big' | 'small';
  close: () => void;
}

const ModalContainer = ({ children, variant, title, close } : ModalProps) => {
  const classes = useStyles();

  console.log('XXX', variant);
  const appendRootClass = useMemo(() => {
    return variant === 'big' ? classes.variantBig : variant === 'small' ? classes.variantSmall : undefined;
  }, [classes.variantBig, classes.variantSmall, variant]);
  

  return (
    <div className={classNames(classes.root, appendRootClass)}>
      <AppBar position="relative">
        <Toolbar className={classes.headerTextContainer}>
          <Typography variant="h4" color="inherit" component="div">
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
    </div>
  );
};

export default ModalContainer;