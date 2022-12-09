import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@emotion/react';
import { enUS, hu } from 'date-fns/locale';
import * as yup from 'yup';
import {
  CalendarViewWeek,
  Contacts,
  Groups,
  Home as HomeIcon,
  InsertChart,
  ManageAccounts,
  PermContactCalendar,
  Search,
} from '@mui/icons-material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import MenuDrawer, { MenuItemType } from './menu/MenuDrawer';

import { FirebaseProvider } from './hooks/firebase';
import { AuthProvider } from './hooks/auth';
import weekTableTheme from './theme/weekTableTheme';
import { BreakpointProvider } from './hooks/breakpoint';
import { UserProvider } from './hooks/user';
import { DialogProvider } from './hooks/dialog';
import ErrorBoundary from './view/common/ErrorBoundary';

export const theme = createTheme(weekTableTheme as ThemeOptions);

const VISIBLE = () => true;

const leftMenu: MenuItemType[] = [
  {
    isVisible: (user) => !!user && user.memberships.length > 0,
    label: 'menu.nextEvents',
    path: '/',
    icon: <HomeIcon />,
  },
  {
    isVisible: (user) => !!user && user.memberships.length > 0,
    label: 'menu.myCalendar',
    path: '/myCalendar',
    icon: <CalendarViewWeek />,
  },
  {
    isVisible: (user) => !!user && user.memberships.length > 0,
    label: 'menu.memberships',
    path: '/memberships',
    icon: <Contacts />,
  },
  {
    isVisible: VISIBLE,
    label: 'menu.searchTrainer',
    path: '/searchTrainer',
    icon: <Search />,
  },
];

const rightMenu: MenuItemType[] = [
  {
    isVisible: (user) => !!user && user.isTrainer,
    label: 'trainer.events',
    path: '/trainerEvents',
    icon: <PermContactCalendar />,
  },
  {
    isVisible: (user) => !!user && user.isTrainer,
    label: 'trainer.calendar',
    path: '/trainerCalendar',
    icon: <CalendarViewWeek />,
  },
  {
    isVisible: (user) => !!user && user.isTrainer,
    label: 'trainer.groups',
    path: '/groups',
    icon: <Groups />,
  },
  {
    isVisible: (user) => !!user && user.isTrainer,
    label: 'menu.userStats',
    path: '/stats',
    icon: <InsertChart />,
  },
  {
    isVisible: VISIBLE,
    label: 'login.profile',
    path: '/profile',
    icon: <ManageAccounts />,
  },
];

function App() {
  const { i18n, t } = useTranslation();
  const locales = { en: enUS, hu };
  const locale = locales[i18n.language as keyof typeof locales];

  useEffect(() => {
    yup.setLocale({
      mixed: {
        required: t('error.required')!,
        notType: (ref) => {
          switch (ref.type) {
            case 'number':
              return  t('error.numberType');
            case 'string':
              return t('error.stringType');
            default:
              return t('error.wrongType');
          }
        },
      },
      string: {
        email: t('error.email')!,
      },
    });
  }, [t]);

  return (
    <ThemeProvider theme={theme}>
      <DialogProvider>
        <BreakpointProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={locale}>
            <Router>
              <FirebaseProvider>
                <AuthProvider>
                  <UserProvider>
                    <ErrorBoundary>
                      <MenuDrawer leftMenu={leftMenu} rightMenu={rightMenu}/>
                    </ErrorBoundary>
                  </UserProvider>
                </AuthProvider>
              </FirebaseProvider>
            </Router>
          </LocalizationProvider>
        </BreakpointProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default App;
