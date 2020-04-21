import React, { useState } from 'react';
import { renderOrCallToRender, Icon, stylesFactory, useTheme } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { useUpdateEffect } from 'react-use';

interface QueryOperationRowProps {
  title?: ((props: { isOpen: boolean }) => React.ReactNode) | React.ReactNode;
  actions?:
    | ((props: { isOpen: boolean; openRow: () => void; closeRow: () => void }) => React.ReactNode)
    | React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  isOpen?: boolean;
}

export const QueryOperationRow: React.FC<QueryOperationRowProps> = ({
  children,
  actions,
  title,
  onClose,
  onOpen,
  isOpen,
}: QueryOperationRowProps) => {
  const [isContentVisible, setIsContentVisible] = useState(isOpen !== undefined ? isOpen : true);
  const theme = useTheme();
  const styles = getQueryOperationRowStyles(theme);
  useUpdateEffect(() => {
    if (isContentVisible) {
      if (onOpen) {
        onOpen();
      }
    } else {
      if (onClose) {
        onClose();
      }
    }
  }, [isContentVisible]);

  const titleElement = title && renderOrCallToRender(title, { isOpen: isContentVisible });
  const actionsElement =
    actions &&
    renderOrCallToRender(actions, {
      isOpen: isContentVisible,
      openRow: () => {
        setIsContentVisible(true);
      },
      closeRow: () => {
        setIsContentVisible(false);
      },
    });

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div
          className={styles.titleWrapper}
          onClick={() => {
            setIsContentVisible(!isContentVisible);
          }}
          aria-label="Query operation row title"
        >
          <Icon name={isContentVisible ? 'angle-down' : 'angle-right'} className={styles.collapseIcon} />
          {title && <span className={styles.title}>{titleElement}</span>}
        </div>
        {actions && actionsElement}
      </div>
      {isContentVisible && <div className={styles.content}>{children}</div>}
    </div>
  );
};

const getQueryOperationRowStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    wrapper: css`
      margin-bottom: ${theme.spacing.formSpacingBase * 2}px;
    `,
    header: css`
      padding: 0 ${theme.spacing.sm};
      border-radius: ${theme.border.radius.sm};
      background: ${theme.colors.bg2};
      height: ${theme.spacing.formInputHeight}px;
      line-height: ${theme.spacing.formInputHeight}px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    collapseIcon: css`
      color: ${theme.colors.textWeak};
    `,
    titleWrapper: css`
      display: flex;
      align-items: center;
      cursor: pointer;
    `,
    title: css`
      font-weight: ${theme.typography.weight.semibold};
      color: ${theme.colors.textBlue};
      margin-left: ${theme.spacing.sm};
    `,
    content: css`
      margin-top: ${theme.spacing.inlineFormMargin};
      margin-left: ${theme.spacing.xl};
    `,
  };
});

QueryOperationRow.displayName = 'QueryOperationRow';
