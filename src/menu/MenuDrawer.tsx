import React, { useCallback, useMemo, useState } from 'react';
import {
  Link, Route, Routes,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@mui/styles';
import {
  AppBar,
  Avatar,
  Button,
  CssBaseline,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar, Typography,
} from '@mui/material';
import { AccountCircle, Logout, ManageAccounts, Menu as MenuIcon } from '@mui/icons-material';
import styles from './MenuDrawer.style';
import Login from '../view/login/Login';
import Verification from '../view/login/Verification';
import RegistrationSuccess from '../view/login/RegistrationSuccess';
import Register from '../view/login/Register';
import PasswordReset from '../view/login/PasswordReset';
import PasswordChange from '../view/login/PasswordChange';
import { User, useUser } from '../hooks/user';
import UserCalendar from '../view/user/UserCalendar';
import TrainingGroups from '../view/trainer/TrainingGroups';
import GroupRouter from '../view/trainer/group/GroupRouter';
import DisplayGroup from '../view/trainer/group/DisplayGroup';
import Profile from '../view/login/Profile';
import MembersList from '../view/trainer/members/MembersList';
import UserMemberships from '../view/user/UserMemberships';
import { useAuth } from '../hooks/auth';
import NextEvents from '../view/user/NextEvents';
import TrainerCalendar from '../view/trainer/events/TrainerCalendar';
import EventPage from '../view/trainer/events/EventPage';
import TrainerEvents from '../view/trainer/events/TrainerEvents';
import SearchTrainer from '../view/user/SearchTrainer';

const useStyles = makeStyles(styles, { name: 'MenuDrawer' });

export type MenuItemType = {
  label: string;
  icon?: React.ReactNode;
  isVisible: (user?: User) => boolean;
  path: string;
};

type Props = {
  leftMenu: MenuItemType[];
  rightMenu: MenuItemType[];
  subMenu?: MenuItemType[];
};

export default function MenuDrawer({ leftMenu, rightMenu }: Props) {
  const classes = useStyles();
  const { logout } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();
  const [state, setState] = useState({ anchorLeft: null, anchorRight: null });

  const { anchorLeft, anchorRight } = state;
  const isLeftOpen = useMemo(() => Boolean(anchorLeft), [anchorLeft]);
  const isRightOpen = useMemo(() => Boolean(anchorRight), [anchorRight]);

  const userName = user ? user.name : '';

  const handleRightMenu = useCallback((event: any) => setState((prev) => ({
    ...prev,
    anchorRight: event.currentTarget,
  })), []);

  const handleLeftMenu = useCallback((event: any) => {
    if (!user) {
      return;
    }
    setState((prev) => ({
      ...prev,
      anchorLeft: event.currentTarget,
    }));
  }, [user]);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, anchorLeft: null, anchorRight: null }));
  }, []);

  const leftVisible = useMemo(() => leftMenu.filter((menu) => user && menu.isVisible(user)), [leftMenu, user]);
  const rightVisible = useMemo(() => rightMenu.filter((menu) => user && menu.isVisible(user)), [rightMenu, user]);

  const renderMenu = useCallback((menus: MenuItemType[]) => {
    return menus.map((item) => (
      <MenuItem component={Link} to={item.path} key={item.path} onClick={handleClose}>
        {item.icon && (
          <ListItemIcon>
            {item.icon}
          </ListItemIcon>
        )}
        <ListItemText primary={t(item.label)} />
      </MenuItem>
    ));
  }, [handleClose, t]);

  return (
    <div className={classes.root}>
      <CssBaseline />

      <AppBar position="fixed">
        <Toolbar disableGutters>
          <IconButton
            color="inherit"
            aria-label="Open drawer"
            aria-controls={isLeftOpen ? 'composition-menu' : undefined}
            aria-expanded={isLeftOpen ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleLeftMenu}
            className={classes.menuButton}
          >
            <MenuIcon
              classes={{
                root: isLeftOpen ? classes.menuButtonIconOpen : classes.menuButtonIconClosed,
              }}
            />
          </IconButton>
          <Menu
            id="menu-left"
            anchorEl={anchorLeft}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={isLeftOpen}
            onClose={handleClose}
          >
            { renderMenu(leftVisible) }
          </Menu>
          <div className={classes.grow}>
          </div>
          <div className={classes.menuHorizontal}>
            { user && <>
              <Button
                color="inherit"
                onClick={handleRightMenu}
                aria-owns={isRightOpen ? 'menu-appbar' : undefined}
                aria-haspopup="true"
              >
                <Typography noWrap className={classes.avatarButton} variant="button">
                  { userName }&nbsp;
                </Typography>
                { user?.photoURL ?
                  <Avatar src={user.photoURL} sx={{ width: 30, height: 30 }} /> :
                  <Avatar sx={{ width: 28, height: 28 }}><AccountCircle /></Avatar>
                }
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorRight}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={isRightOpen}
                onClose={handleClose}
              >
                { renderMenu(rightVisible) }
                <MenuItem key="logout" onClick={logout}>
                  <ListItemIcon><Logout /></ListItemIcon>
                  <ListItemText primary={t('common.logout')} />
                </MenuItem>

              </Menu>
            </>}
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <div className={classes.container}>
          <Routes>
            <Route index element={<NextEvents />} />
            <Route path="myCalendar" element={<UserCalendar />} />
            <Route path="trainerCalendar" element={<TrainerCalendar />} />
            <Route path="searchTrainer" element={<SearchTrainer />} />
            <Route path="test" element={<ManageAccounts />} />
            <Route path="memberships" element={<UserMemberships />} />
            <Route path="memberships/:groupId" element={<UserMemberships />} />
            <Route path="profile" element={<Profile />} />
            <Route path="groups" element={<TrainingGroups />} />
            <Route path="trainerEvents" element={<TrainerEvents />} />
            <Route path="group/:groupId" element={<GroupRouter />} >
              <Route index element={<DisplayGroup />} />
              <Route path="members" element={<MembersList />} />
              <Route path="events" element={<TrainerEvents />} />
              <Route path="event/:eventId" element={<EventPage />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="verification" element={<Verification />} />
            <Route path="registrationSuccess" element={<RegistrationSuccess />} />
            <Route path="register" element={<Register />} />
            <Route path="resetPassword" element={<PasswordReset />} />
            <Route path="changePassword" element={<PasswordChange />} />
            <Route path="*">
              NOT EXISTS
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
}
