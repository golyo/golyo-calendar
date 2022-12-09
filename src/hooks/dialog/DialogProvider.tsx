import React, { useCallback, useContext, useMemo, useState } from 'react';
import DialogContext, { BackdropType, CheckIfConfirmDialogType, ConfirmDialogType, DialogType } from './DialogContext';
import ConfirmDialog from '../../view/common/ConfirmDialog';
import { Alert, Backdrop, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { css, useTheme } from '@emotion/react';
import { ThemeOptions } from '@mui/material/styles';

const BACKDROP_MESSAGE_LATENCY = 1500;

const pushMessage = (messages: string[], message?: string | false) => {
  if (message) {
    return [...messages, message];
  }
  return messages;
};

const styles = (theme: ThemeOptions) => ({
  backdrop: css`
      color: #fff;
      flex-direction: column;
      z-index: ${theme.zIndex!.modal! + 1};
    `
});

const DialogProvider = ({ children } : { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const theme = useTheme();
  const css = useMemo(() => styles(theme), [theme]);
  const [backdropState, setBackdropState] = useState<BackdropType>({ messages: [], backdropNo: 0 });
  const [dialogType, setDialogType] = useState<DialogType | undefined>();

  const showDialog = useCallback((dialog: DialogType) => {
    if (!dialog.buttons) {
      dialog.buttons = [{ label: 'common.ok', onClick: () => {} }];
    }
    setDialogType(dialog);
    setOpen(true);
  }, []);

  const showConfirmDialog = useCallback(({ title = 'common.confirm', description, okCallback, cancelCallback }: ConfirmDialogType) => {
    showDialog({
      title,
      description,
      buttons: [
        { label: 'common.yes', onClick: okCallback },
        { label: 'common.cancel', onClick: cancelCallback },
      ],
    });
  }, [showDialog]);

  const checkIfConfirmDialog = useCallback((dialog: CheckIfConfirmDialogType) => {
    const { title, description, doCallback, isShowDialog } = dialog;
    if (isShowDialog()) {
      showConfirmDialog({ title, description, okCallback: doCallback });
    } else if (doCallback) {
      doCallback();
    }
  }, [showConfirmDialog]);

  const hideDialog = useCallback(() => setOpen(false), []);

  const showBackdrop = useCallback((message?: string | false) => setBackdropState((prev) => ({
    messages: pushMessage(prev.messages, message),
    backdropNo: prev.backdropNo + 1,
  })), []);

  const decBackdrop = useCallback(() => setBackdropState((prev) => ({
    messages: prev.backdropNo > 1 ? prev.messages : [],
    backdropNo: prev.backdropNo - 1,
  })), []);

  const hideBackdrop = useCallback((message?: string | false) => {
    if (message) {
      setBackdropState((prev) => ({
        messages: pushMessage(prev.messages, message),
        backdropNo: prev.backdropNo,
      }));
      setTimeout(decBackdrop, BACKDROP_MESSAGE_LATENCY);
    } else {
      decBackdrop();
    }
  }, [decBackdrop]);

  const context = useMemo( () => ({
    showDialog,
    showConfirmDialog,
    checkIfConfirmDialog,
    hideDialog,
    showBackdrop,
    hideBackdrop,
  }), [showDialog, showConfirmDialog, checkIfConfirmDialog, hideDialog, showBackdrop, hideBackdrop]);

  return (
    <DialogContext.Provider value={ context }>
      {dialogType && <ConfirmDialog {...dialogType} open={open} hideDialog={hideDialog} /> }
      <Backdrop
        css={css.backdrop}
        open={backdropState.backdropNo > 0}
      >
        {backdropState.messages.map((message, idx) => (
          <Alert key={idx} variant="filled" severity="success" className="hidingAlert">
            {t(message)}
          </Alert>
        ))}
        <div>
          <CircularProgress color="inherit" size={50}/>
        </div>
      </Backdrop>
      { children }
    </DialogContext.Provider>
  );
};

const useDialog = () => useContext(DialogContext);

export { DialogProvider, useDialog };