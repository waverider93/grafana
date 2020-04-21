import React, { FC } from 'react';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Icon } from '../Icon/Icon';
import { IconName } from '../../types';
import { stylesFactory, useTheme } from '../../themes';
import { Counter } from './Counter';

export interface TabProps {
  label: string;
  active?: boolean;
  icon?: IconName;
  onChangeTab: () => void;
  counter?: number;
}

const getTabStyles = stylesFactory((theme: GrafanaTheme) => {
  const colors = theme.colors;

  return {
    tabItem: css`
      list-style: none;
      padding: 11px 15px 9px;
      margin-right: ${theme.spacing.md};
      position: relative;
      display: block;
      border: solid transparent;
      border-width: 0 1px 1px;
      border-radius: ${theme.border.radius.md} ${theme.border.radius.md} 0 0;
      color: ${colors.text};
      cursor: pointer;

      svg {
        margin-right: ${theme.spacing.sm};
      }

      &:hover,
      &:focus {
        color: ${colors.linkHover};
      }
    `,
    activeStyle: css`
      border-color: ${theme.palette.orange} ${colors.pageHeaderBorder} transparent;
      background: ${colors.bodyBg};
      color: ${colors.link};
      overflow: hidden;

      &::before {
        display: block;
        content: ' ';
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        top: 0;
        background-image: linear-gradient(to right, #f05a28 30%, #fbca0a 99%);
      }
    `,
  };
});

export const Tab: FC<TabProps> = ({ label, active, icon, onChangeTab, counter }) => {
  const theme = useTheme();
  const tabsStyles = getTabStyles(theme);

  return (
    <li className={cx(tabsStyles.tabItem, active && tabsStyles.activeStyle)} onClick={onChangeTab}>
      {icon && <Icon name={icon} />}
      {label}
      {typeof counter === 'number' && <Counter value={counter} />}
    </li>
  );
};
