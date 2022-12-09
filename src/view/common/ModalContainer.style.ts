import { css } from '@emotion/react';

const styles = {
  outer: css`
    position: absolute;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
  `,
  root: css`
    outline: none;
    max-height: 100vh;
    overflow: auto;
    align-self: center;
    background-color: white;
  `,
  modalContent: css`
    padding: 15px 20px;
  `,
  variantBig: css`
    min-width: max(80vw, 320px);
    max-width: 98vw;
  `,
  variantSmall: css`
    min-width: 40vw;
    max-width: 98vw;
  `,
  headerTitle: css`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 10px;
  `,
  headerTextContainer: css`
    display: flex;
    justify-content: space-between;
  `,
};

export default styles;
