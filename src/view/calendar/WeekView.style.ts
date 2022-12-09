import { css } from '@emotion/react';
import { Breakpoints } from '../../hooks/breakpoint';

import { mq } from '../../hooks/breakpoint/BreakpointProvider';
import { WeekTheme } from '../../theme/weekTableTheme';

export const breakpointLineHeightMap: Record<Breakpoints, number> = {
  xs: 40,
  sm: 50,
  md: 60,
  lg: 60,
};

const styles = (theme: WeekTheme) => ({
  root: css`
    padding-bottom: 20px;
  `,
  headerNavigation: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  headerLabel: css(mq({
    display: ['none', 'inline'],
  })),
  weekCell: css(mq({
    padding: 0,
    overflow: 'visible',
    position: 'relative',
    fontSize: ['0.56rem', '0.75rem', '1rem'],
    lineHeight: [1.2, 1.4, 1.6],
    height: breakpointLineHeightMap,
    borderRight: ['1px solid red'],
  })),
  headerContent: css`
    textAlign: center;
    height: 100%;
    backgroundColor: ${theme.palette.weekPalette.headerBGColor};
    color: ${theme.palette.weekPalette.headerTextColor};
    padding: 4px;
  `,
  eventContent: css`
    margin: 2px;
    padding: 2px;
    position: absolute;
    width: calc(100% - 4px);
    overflow: hidden;
    cursor: pointer;
    display: block;
    zIndex: 2;
    textAlign: center;
    borderRadius: 8;
  `,
  eventBadge: css`
    position: absolute;
    bottom: 0px;
    right: 0px;
    fontSize: 0.56rem;
    height: 15px;
    .MuiChip-label {
      padding-left: 5px;
      padding-right: 5px;
    },
  `,
  checkBadge: css`
    position: absolute;
    bottom: 0px;
    left: 0px;
    fontSize: 1.2rem;
  `,
  chipContent: css`
    height: 100%;
  `,
  timeChip: css(mq({
    position: 'relative',
    fontSize: '0.56rem',
    top: ['28px', '38px', '46px'],
  })),
});

export default styles;