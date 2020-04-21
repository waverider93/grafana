import React, { FC, useCallback, useRef, useEffect } from 'react';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { e2e } from '@grafana/e2e';
import { Icon, useTheme, TagList, styleMixins, stylesFactory } from '@grafana/ui';
import { updateLocation } from 'app/core/reducers/location';
import { DashboardSectionItem, OnToggleChecked } from '../types';
import { SearchCheckbox } from './SearchCheckbox';

export interface Props {
  item: DashboardSectionItem;
  editable?: boolean;
  onTagSelected: (name: string) => any;
  onToggleChecked?: OnToggleChecked;
}

const { selectors } = e2e.pages.Dashboards;

export const SearchItem: FC<Props> = ({ item, editable, onToggleChecked, onTagSelected }) => {
  const theme = useTheme();
  const styles = getResultsItemStyles(theme);
  const inputEl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preventDef = (event: MouseEvent) => {
      // manually prevent default on TagList click, as doing it via normal onClick doesn't work inside angular
      event.preventDefault();
    };
    if (inputEl.current) {
      inputEl.current.addEventListener('click', preventDef);
    }
    return () => {
      inputEl.current!.removeEventListener('click', preventDef);
    };
  }, []);

  const onItemClick = () => {
    //Check if one string can be found in the other
    if (window.location.pathname.includes(item.url) || item.url.includes(window.location.pathname)) {
      updateLocation({
        query: { search: null },
        partial: true,
      });
    }
  };

  const tagSelected = useCallback((tag: string, event: React.MouseEvent<HTMLElement>) => {
    onTagSelected(tag);
  }, []);

  const toggleItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (onToggleChecked) {
        onToggleChecked(item);
      }
    },
    [item]
  );

  return (
    <li
      aria-label={selectors.dashboards(item.title)}
      className={cx(styles.wrapper, { [styles.selected]: item.selected })}
    >
      <SearchCheckbox editable={editable} checked={item.checked} onClick={toggleItem} />
      <a href={item.url} className={styles.link}>
        <Icon className={styles.icon} name="apps" size="lg" />
        <div className={styles.body} onClick={onItemClick}>
          <span>{item.title}</span>
          <span className={styles.folderTitle}>{item.folderTitle}</span>
        </div>
        <span ref={inputEl}>
          <TagList tags={item.tags} onClick={tagSelected} className={styles.tags} />
        </span>
      </a>
    </li>
  );
};

const getResultsItemStyles = stylesFactory((theme: GrafanaTheme) => ({
  wrapper: css`
    ${styleMixins.listItem(theme)};
    display: flex;
    align-items: center;
    margin: ${theme.spacing.xxs};
    padding: 0 ${theme.spacing.sm};
    min-height: 37px;

    :hover {
      cursor: pointer;
    }
  `,
  selected: css`
    ${styleMixins.listItemSelected(theme)};
  `,
  body: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1 1 auto;
    overflow: hidden;
    padding: 0 10px;
  `,
  folderTitle: css`
    color: ${theme.colors.textWeak};
    font-size: ${theme.typography.size.xs};
    line-height: ${theme.typography.lineHeight.xs};
    position: relative;
    top: -1px;
  `,
  icon: css`
    margin-left: 10px;
  `,
  tags: css`
    justify-content: flex-end;
    @media only screen and (max-width: ${theme.breakpoints.md}) {
      display: none;
    }
  `,
  link: css`
    display: flex;
    align-items: center;
    width: 100%;
  `,
}));
