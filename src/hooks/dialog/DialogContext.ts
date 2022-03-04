import React from 'react';

export interface ConfirmDialogType {
  title?: string;
  description: string;
  okCallback?: () => void;
  cancelCallback?: () => void;
}

export interface CheckIfConfirmDialogType {
  title?: string;
  description: string;
  isShowDialog: () => boolean;
  doCallback?: () => void;
}

export interface WarningDialogType {
  title: string;
  description: string;
  okCallback?: () => void;
}

interface ButtonType {
  label: string;
  onClick?: () => void;
}

export interface DialogType {
  title: string;
  description: string;
  buttons?: ButtonType[];
}

export interface BackdropType {
  messages: string[];
  backdropNo: number;
}

interface DialogContextType {
  showConfirmDialog: (dialog: ConfirmDialogType) => void;
  checkIfConfirmDialog: (dialog: CheckIfConfirmDialogType) => void;
  showDialog: (dialog: DialogType) => void;
  hideDialog: () => void;
  showBackdrop: (message?: string) => void;
  hideBackdrop: (message?: string) => void;
}

const DialogContext = React.createContext<DialogContextType>({} as DialogContextType);

export default DialogContext;