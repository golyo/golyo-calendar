import * as colors from '@mui/material/colors';
import { Theme } from '@emotion/react';

export interface WeekTablePalette {
  headerBGColor?: string,
  headerTextColor?: string,
  eventColors: string[],
}

export interface IPalette {
  weekPalette: WeekTablePalette,
}
export interface WeekTheme extends Theme {
  palette: IPalette;
}

// @ts-ignore
export const EVENT_COLORS = Object.keys(colors).filter((key) => key !== 'common').map((key) => colors[key][300]);

const weekTableTheme = {
  palette: {
    weekPalette: {
      eventColors: EVENT_COLORS,
    },
  },
  typography: {
    body2: { display: 'inline' },
  },
  components: {
    ModalContainer: {
      variants: [
        {
          props: { variant: 'small' },
          style: {
            minWidth: '40vw',
            maxWidth: '98vw',
          },
        },
        {
          props: { variant: 'big' },
          style: {
            minWidth: 'max(80vw, 320px)',
            maxWidth: '98vw',
          },
        },
      ],
    },
  },
};

export default weekTableTheme;