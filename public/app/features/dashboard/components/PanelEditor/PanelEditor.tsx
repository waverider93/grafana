import React, { PureComponent } from 'react';
import { FieldConfigSource, GrafanaTheme, PanelData, PanelPlugin } from '@grafana/data';
import { Button, stylesFactory, Icon, RadioButtonGroup } from '@grafana/ui';
import { css, cx } from 'emotion';
import config from 'app/core/config';
import AutoSizer from 'react-virtualized-auto-sizer';

import { PanelModel } from '../../state/PanelModel';
import { DashboardModel } from '../../state/DashboardModel';
import { DashboardPanel } from '../../dashgrid/DashboardPanel';

import SplitPane from 'react-split-pane';
import { StoreState } from '../../../../types/store';
import { connect, MapDispatchToProps, MapStateToProps } from 'react-redux';
import { updateLocation } from '../../../../core/reducers/location';
import { Unsubscribable } from 'rxjs';
import { DisplayMode, displayModes, PanelEditorTab } from './types';
import { PanelEditorTabs } from './PanelEditorTabs';
import { DashNavTimeControls } from '../DashNav/DashNavTimeControls';
import { LocationState, CoreEvents } from 'app/types';
import { calculatePanelSize } from './utils';
import { initPanelEditor, panelEditorCleanUp, updatePanelEditorUIState } from './state/actions';
import { PanelEditorUIState, setDiscardChanges } from './state/reducers';
import { getPanelEditorTabs } from './state/selectors';
import { getPanelStateById } from '../../state/selectors';
import { OptionsPaneContent } from './OptionsPaneContent';
import { DashNavButton } from 'app/features/dashboard/components/DashNav/DashNavButton';
import { VariableModel } from 'app/features/templating/types';
import { getVariables } from 'app/features/variables/state/selectors';
import { SubMenuItems } from 'app/features/dashboard/components/SubMenu/SubMenuItems';
import { BackButton } from 'app/core/components/BackButton/BackButton';
import { appEvents } from 'app/core/core';
import { SaveDashboardModalProxy } from '../SaveDashboard/SaveDashboardModalProxy';

interface OwnProps {
  dashboard: DashboardModel;
  sourcePanel: PanelModel;
}

interface ConnectedProps {
  location: LocationState;
  plugin?: PanelPlugin;
  panel: PanelModel;
  data: PanelData;
  initDone: boolean;
  tabs: PanelEditorTab[];
  uiState: PanelEditorUIState;
  variables: VariableModel[];
}

interface DispatchProps {
  updateLocation: typeof updateLocation;
  initPanelEditor: typeof initPanelEditor;
  panelEditorCleanUp: typeof panelEditorCleanUp;
  setDiscardChanges: typeof setDiscardChanges;
  updatePanelEditorUIState: typeof updatePanelEditorUIState;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

export class PanelEditorUnconnected extends PureComponent<Props> {
  querySubscription: Unsubscribable;

  componentDidMount() {
    this.props.initPanelEditor(this.props.sourcePanel, this.props.dashboard);
  }

  componentWillUnmount() {
    this.props.panelEditorCleanUp();
  }

  onPanelExit = () => {
    this.props.updateLocation({
      query: { editPanel: null, tab: null },
      partial: true,
    });
  };

  onDiscard = () => {
    this.props.setDiscardChanges(true);
    this.props.updateLocation({
      query: { editPanel: null, tab: null },
      partial: true,
    });
  };

  onOpenDashboardSettings = () => {
    this.props.updateLocation({ query: { editview: 'settings' }, partial: true });
  };

  onSaveDashboard = () => {
    appEvents.emit(CoreEvents.showModalReact, {
      component: SaveDashboardModalProxy,
      props: { dashboard: this.props.dashboard },
    });
  };

  onChangeTab = (tab: PanelEditorTab) => {
    this.props.updateLocation({ query: { tab: tab.id }, partial: true });
  };

  onFieldConfigChange = (config: FieldConfigSource) => {
    const { panel } = this.props;

    panel.updateFieldConfig({
      ...config,
    });
    this.forceUpdate();
  };

  onPanelOptionsChanged = (options: any) => {
    this.props.panel.updateOptions(options);
    this.forceUpdate();
  };

  onPanelConfigChanged = (configKey: string, value: any) => {
    // @ts-ignore
    this.props.panel[configKey] = value;
    this.props.panel.render();
    this.forceUpdate();
  };

  onDragFinished = (pane: Pane, size?: number) => {
    document.body.style.cursor = 'auto';

    // When the drag handle is just clicked size is undefined
    if (!size) {
      return;
    }

    const targetPane = pane === Pane.Top ? 'topPaneSize' : 'rightPaneSize';
    const { updatePanelEditorUIState } = this.props;
    updatePanelEditorUIState({
      [targetPane]: size,
    });
  };

  onDragStarted = () => {
    document.body.style.cursor = 'row-resize';
  };

  onDiplayModeChange = (mode: DisplayMode) => {
    const { updatePanelEditorUIState } = this.props;
    updatePanelEditorUIState({
      mode: mode,
    });
  };

  onTogglePanelOptions = () => {
    const { uiState, updatePanelEditorUIState } = this.props;
    updatePanelEditorUIState({ isPanelOptionsVisible: !uiState.isPanelOptionsVisible });
  };

  renderHorizontalSplit(styles: EditorStyles) {
    const { dashboard, panel, tabs, data, uiState } = this.props;

    return (
      <SplitPane
        split="horizontal"
        minSize={50}
        primary="first"
        /* Use persisted state for default size */
        defaultSize={uiState.topPaneSize}
        pane2Style={{ minHeight: 0 }}
        resizerClassName={styles.resizerH}
        onDragStarted={this.onDragStarted}
        onDragFinished={size => this.onDragFinished(Pane.Top, size)}
      >
        <div className={styles.mainPaneWrapper}>
          {this.renderPanelToolbar(styles)}
          <div className={styles.panelWrapper}>
            <AutoSizer>
              {({ width, height }) => {
                if (width < 3 || height < 3) {
                  return null;
                }
                return (
                  <div className={styles.centeringContainer} style={{ width, height }}>
                    <div style={calculatePanelSize(uiState.mode, width, height, panel)}>
                      <DashboardPanel
                        dashboard={dashboard}
                        panel={panel}
                        isEditing={true}
                        isViewing={false}
                        isInView={true}
                      />
                    </div>
                  </div>
                );
              }}
            </AutoSizer>
          </div>
        </div>
        <div className={styles.tabsWrapper}>
          <PanelEditorTabs panel={panel} dashboard={dashboard} tabs={tabs} onChangeTab={this.onChangeTab} data={data} />
        </div>
      </SplitPane>
    );
  }

  renderTemplateVariables(styles: EditorStyles) {
    const { variables } = this.props;

    if (!variables.length) {
      return null;
    }

    return (
      <div className={styles.variablesWrapper}>
        <SubMenuItems variables={variables} />
      </div>
    );
  }

  renderPanelToolbar(styles: EditorStyles) {
    const { dashboard, location, uiState } = this.props;

    return (
      <div className={styles.panelToolbar}>
        {this.renderTemplateVariables(styles)}
        <div className="flex-grow-1" />
        <div className={styles.toolbarItem}>
          <RadioButtonGroup value={uiState.mode} options={displayModes} onChange={this.onDiplayModeChange} />
        </div>
        <div className={styles.toolbarItem}>
          <DashNavTimeControls dashboard={dashboard} location={location} updateLocation={updateLocation} />
        </div>
        {!uiState.isPanelOptionsVisible && (
          <div className={styles.toolbarItem}>
            <DashNavButton onClick={this.onTogglePanelOptions} tooltip="Open options pane" classSuffix="close-options">
              <Icon name="angle-left" /> <span style={{ paddingLeft: '6px' }}>Show options</span>
            </DashNavButton>
          </div>
        )}
      </div>
    );
  }

  editorToolbar(styles: EditorStyles) {
    const { dashboard } = this.props;

    return (
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarLeft}>
          <BackButton onClick={this.onPanelExit} surface="panel" />
          <span className={styles.editorTitle}>{dashboard.title} / Edit Panel</span>
        </div>
        <div className={styles.toolbarLeft}>
          <div className={styles.toolbarItem}>
            <Button
              icon="cog"
              onClick={this.onOpenDashboardSettings}
              variant="secondary"
              title="Open dashboad settings"
            />
          </div>
          <div className={styles.toolbarItem}>
            <Button onClick={this.onDiscard} variant="secondary" title="Undo all changes">
              Discard
            </Button>
          </div>
          <div className={styles.toolbarItem}>
            <Button onClick={this.onSaveDashboard} variant="secondary" title="Apply changes and save dashboard">
              Save
            </Button>
          </div>
          <div className={styles.toolbarItem}>
            <Button onClick={this.onPanelExit} title="Apply changes and go back to dashboard">
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderOptionsPane() {
    const { plugin, dashboard, data, panel, uiState } = this.props;

    if (!plugin) {
      return <div />;
    }

    return (
      <OptionsPaneContent
        plugin={plugin}
        dashboard={dashboard}
        data={data}
        panel={panel}
        width={uiState.rightPaneSize as number}
        onClose={this.onTogglePanelOptions}
        onFieldConfigsChange={this.onFieldConfigChange}
        onPanelOptionsChanged={this.onPanelOptionsChanged}
        onPanelConfigChange={this.onPanelConfigChanged}
      />
    );
  }

  renderWithOptionsPane(styles: EditorStyles) {
    const { uiState } = this.props;

    return (
      <SplitPane
        split="vertical"
        minSize={100}
        primary="second"
        /* Use persisted state for default size */
        defaultSize={uiState.rightPaneSize}
        resizerClassName={styles.resizerV}
        onDragStarted={() => (document.body.style.cursor = 'col-resize')}
        onDragFinished={size => this.onDragFinished(Pane.Right, size)}
      >
        {this.renderHorizontalSplit(styles)}
        {this.renderOptionsPane()}
      </SplitPane>
    );
  }

  render() {
    const { initDone, uiState } = this.props;
    const styles = getStyles(config.theme, this.props);

    if (!initDone) {
      return null;
    }

    return (
      <div className={styles.wrapper}>
        {this.editorToolbar(styles)}
        <div className={styles.verticalSplitPanesWrapper}>
          {uiState.isPanelOptionsVisible ? this.renderWithOptionsPane(styles) : this.renderHorizontalSplit(styles)}
        </div>
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state, props) => {
  const panel = state.panelEditor.getPanel();
  const { plugin } = getPanelStateById(state.dashboard, panel.id);

  return {
    location: state.location,
    plugin: plugin,
    panel: state.panelEditor.getPanel(),
    data: state.panelEditor.getData(),
    initDone: state.panelEditor.initDone,
    tabs: getPanelEditorTabs(state.location, plugin),
    uiState: state.panelEditor.ui,
    variables: getVariables(state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  updateLocation,
  initPanelEditor,
  panelEditorCleanUp,
  setDiscardChanges,
  updatePanelEditorUIState,
};

export const PanelEditor = connect(mapStateToProps, mapDispatchToProps)(PanelEditorUnconnected);

enum Pane {
  Right,
  Top,
}

/*
 * Styles
 */
export const getStyles = stylesFactory((theme: GrafanaTheme, props: Props) => {
  const { uiState } = props;
  const handleColor = theme.palette.blue95;
  const paneSpaceing = theme.spacing.md;

  const resizer = css`
    font-style: italic;
    background: transparent;
    border-top: 0;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-color: transparent;
    border-style: solid;
    transition: 0.2s border-color ease-in-out;

    &:hover {
      border-color: ${handleColor};
    }
  `;

  return {
    wrapper: css`
      width: 100%;
      height: 100%;
      position: fixed;
      z-index: ${theme.zIndex.sidemenu};
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.colors.dashboardBg};
      display: flex;
      flex-direction: column;
    `,
    verticalSplitPanesWrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
    `,
    mainPaneWrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding-right: ${uiState.isPanelOptionsVisible ? 0 : paneSpaceing};
    `,
    variablesWrapper: css`
      display: flex;
    `,
    panelWrapper: css`
      flex: 1 1 0;
      min-height: 0;
      width: 100%;
      padding-left: ${paneSpaceing};
    `,
    resizerV: cx(
      resizer,
      css`
        cursor: col-resize;
        width: ${paneSpaceing};
        border-right-width: 1px;
        margin-top: 18px;
      `
    ),
    resizerH: cx(
      resizer,
      css`
        height: ${paneSpaceing};
        cursor: row-resize;
        position: relative;
        top: 0px;
        z-index: 1;
        border-top-width: 1px;
        margin-left: ${paneSpaceing};
      `
    ),
    tabsWrapper: css`
      height: 100%;
      width: 100%;
    `,
    editorToolbar: css`
      display: flex;
      padding: ${theme.spacing.sm};
      background: ${theme.colors.panelBg};
      justify-content: space-between;
      border-bottom: 1px solid ${theme.colors.panelBorder};
    `,
    panelToolbar: css`
      display: flex;
      padding: ${paneSpaceing} 0 ${paneSpaceing} ${paneSpaceing};
      justify-content: space-between;
      flex-wrap: wrap;
    `,
    toolbarLeft: css`
      padding-left: ${theme.spacing.sm};
      display: flex;
      align-items: center;
    `,
    toolbarItem: css`
      margin-right: ${theme.spacing.sm};

      &:last-child {
        margin-right: 0;
      }
    `,
    centeringContainer: css`
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    editorTitle: css`
      font-size: ${theme.typography.size.lg};
      padding-left: ${theme.spacing.md};
    `,
  };
});

type EditorStyles = ReturnType<typeof getStyles>;
