
import { css } from '@emotion/react';

const drawerWidth = 200;

const styles  = () => ({
  root: css`
    min-width: 320vw;
    display: flex;
  `,
  menuButton: css`
    margin-left: 12px;
    margin-right: 36px;
  `,
  hide: css`
    display: none;
  `,
  drawer: css`
    width: ${drawerWidth}px;
    flexShrink: 0;
    white-space: nowrap;
    z-index: 100;
  `,
  drawerOpen: css`
    width: ${drawerWidth}px;
  `,
  drawerClose: css`
    overflow-x: hidden;
    width: 100px;
  `,
  toolbar: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
  `,
  content: css`
    flex-grow: 1;
    width: 100vw;
  `,
  grow: css`
    flex-grow: 1;
  `,
  container: css`
    padding: 20px;
  `,
  menuHorizontal: css`
    display: flex;
    flex-direction: row;
    gap: 10px;
  `,
  avatarButton: css`
    max-width: 120px;
  `,
});

export default styles;
