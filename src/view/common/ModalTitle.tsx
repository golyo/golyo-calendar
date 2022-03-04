import Typography from '@mui/material/Typography';
import { Divider, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import * as React from 'react';
import { createStyles, makeStyles } from '@mui/styles';

interface ModalTitleProps {
  children: React.ReactNode;
  close: () => void;
}

const style = () => createStyles({
  headerContainer: {
    marginBottom: '20px',
  },
  headerTextContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

const useStyles = makeStyles(style, { name: 'ModalTitle' });

const ModalTitle = ({ children, close }: ModalTitleProps) => {
  const classes = useStyles();

  return (
    <div className={classes.headerContainer}>
      <div className={classes.headerTextContainer}>
        <Typography variant="h6" component="h2">
          { children }
        </Typography>
        <IconButton onClick={close} color="error">
          <Close></Close>
        </IconButton>
      </div>
      <Divider />
    </div>
  );
};

export default ModalTitle;