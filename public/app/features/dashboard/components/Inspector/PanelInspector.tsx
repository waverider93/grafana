import React, { PureComponent } from 'react';
import { Unsubscribable } from 'rxjs';
import { connect, MapStateToProps } from 'react-redux';
import { InspectSubtitle } from './InspectSubtitle';
import { InspectJSONTab } from './InspectJSONTab';
import { QueryInspector } from './QueryInspector';

import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { JSONFormatter, Drawer, TabContent, CustomScrollbar } from '@grafana/ui';
import { getLocationSrv, getDataSourceSrv } from '@grafana/runtime';
import {
  DataFrame,
  DataSourceApi,
  SelectableValue,
  getDisplayProcessor,
  DataQueryError,
  PanelData,
  FieldType,
  formattedValueToString,
  QueryResultMetaStat,
  LoadingState,
  PanelPlugin,
} from '@grafana/data';
import { config } from 'app/core/config';
import { getPanelInspectorStyles } from './styles';
import { StoreState } from 'app/types';
import { InspectDataTab } from './InspectDataTab';

interface OwnProps {
  dashboard: DashboardModel;
  panel: PanelModel;
  defaultTab: InspectTab;
}

export interface ConnectedProps {
  plugin?: PanelPlugin | null;
}

export type Props = OwnProps & ConnectedProps;

export enum InspectTab {
  Data = 'data',
  Meta = 'meta', // When result metadata exists
  Error = 'error',
  Stats = 'stats',
  JSON = 'json',
  Query = 'query',
}

interface State {
  isLoading: boolean;
  // The last raw response
  last: PanelData;
  // Data from the last response
  data: DataFrame[];
  // The Selected Tab
  currentTab: InspectTab;
  // If the datasource supports custom metadata
  metaDS?: DataSourceApi;
  // drawer width
  drawerWidth: string;
}

export class PanelInspectorUnconnected extends PureComponent<Props, State> {
  querySubscription?: Unsubscribable;

  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: true,
      last: {} as PanelData,
      data: [],
      currentTab: props.defaultTab ?? InspectTab.Data,
      drawerWidth: '50%',
    };
  }

  componentDidMount() {
    const { plugin } = this.props;

    if (plugin) {
      this.init();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.plugin !== this.props.plugin) {
      this.init();
    }
  }

  /**
   * This init process where we do not have a plugin to start with is to handle full page reloads with inspect url parameter
   * When this inspect drawer loads the plugin is not yet loaded.
   */
  init() {
    const { plugin, panel } = this.props;

    if (plugin && !plugin.meta.skipDataQuery) {
      this.querySubscription = panel
        .getQueryRunner()
        .getData()
        .subscribe({
          next: data => this.onUpdateData(data),
        });
    }
  }

  componentWillUnmount() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }

  async onUpdateData(lastResult: PanelData) {
    let metaDS: DataSourceApi;
    const data = lastResult.series;
    const error = lastResult.error;

    const targets = lastResult.request?.targets || [];

    // Find the first DataSource wanting to show custom metadata
    if (data && targets.length) {
      for (const frame of data) {
        if (frame.meta && frame.meta.custom) {
          // get data source from first query
          const dataSource = await getDataSourceSrv().get(targets[0].datasource);

          if (dataSource && dataSource.components?.MetadataInspector) {
            metaDS = dataSource;
            break;
          }
        }
      }
    }

    // Set last result, but no metadata inspector
    this.setState(prevState => ({
      isLoading: lastResult.state === LoadingState.Loading,
      last: lastResult,
      data,
      metaDS,
      currentTab: error ? InspectTab.Error : prevState.currentTab,
    }));
  }

  onClose = () => {
    getLocationSrv().update({
      query: { inspect: null, inspectTab: null },
      partial: true,
    });
  };

  onToggleExpand = () => {
    this.setState(prevState => ({
      drawerWidth: prevState.drawerWidth === '100%' ? '40%' : '100%',
    }));
  };

  onSelectTab = (item: SelectableValue<InspectTab>) => {
    this.setState({ currentTab: item.value || InspectTab.Data });
  };

  renderMetadataInspector() {
    const { metaDS, data } = this.state;
    if (!metaDS || !metaDS.components?.MetadataInspector) {
      return <div>No Metadata Inspector</div>;
    }
    return <metaDS.components.MetadataInspector datasource={metaDS} data={data} />;
  }

  renderDataTab() {
    const { last, isLoading } = this.state;
    return <InspectDataTab data={last.series} isLoading={isLoading} />;
  }

  renderErrorTab(error?: DataQueryError) {
    if (!error) {
      return null;
    }
    if (error.data) {
      return (
        <>
          <h3>{error.data.message}</h3>
          <JSONFormatter json={error} open={2} />
        </>
      );
    }
    return <div>{error.message}</div>;
  }

  renderStatsTab() {
    const { last } = this.state;
    const { request } = last;

    if (!request) {
      return null;
    }

    let stats: QueryResultMetaStat[] = [];

    const requestTime = request.endTime ? request.endTime - request.startTime : -1;
    const processingTime = last.timings?.dataProcessingTime || -1;
    let dataRows = 0;

    for (const frame of last.series) {
      dataRows += frame.length;
    }

    stats.push({ title: 'Total request time', value: requestTime, unit: 'ms' });
    stats.push({ title: 'Data processing time', value: processingTime, unit: 'ms' });
    stats.push({ title: 'Number of queries', value: request.targets.length });
    stats.push({ title: 'Total number rows', value: dataRows });

    let dataStats: QueryResultMetaStat[] = [];

    for (const series of last.series) {
      if (series.meta && series.meta.stats) {
        dataStats = dataStats.concat(series.meta.stats);
      }
    }

    return (
      <>
        {this.renderStatsTable('Stats', stats)}
        {this.renderStatsTable('Data source stats', dataStats)}
      </>
    );
  }

  renderStatsTable(name: string, stats: QueryResultMetaStat[]) {
    if (!stats || !stats.length) {
      return null;
    }

    return (
      <div style={{ paddingBottom: '16px' }}>
        <div className="section-heading">{name}</div>
        <table className="filter-table width-30">
          <tbody>
            {stats.map((stat, index) => {
              return (
                <tr key={`${stat.title}-${index}`}>
                  <td>{stat.title}</td>
                  <td style={{ textAlign: 'right' }}>{formatStat(stat)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  drawerSubtitle(tabs: Array<{ label: string; value: InspectTab }>, activeTab: InspectTab) {
    const { last } = this.state;

    return <InspectSubtitle tabs={tabs} tab={activeTab} panelData={last} onSelectTab={this.onSelectTab} />;
  }

  getTabs() {
    const { dashboard, plugin } = this.props;
    const { last } = this.state;
    const error = last?.error;
    const tabs = [];

    if (plugin && !plugin.meta.skipDataQuery) {
      tabs.push({ label: 'Data', value: InspectTab.Data });
      tabs.push({ label: 'Stats', value: InspectTab.Stats });
    }

    if (this.state.metaDS) {
      tabs.push({ label: 'Meta Data', value: InspectTab.Meta });
    }

    tabs.push({ label: 'JSON', value: InspectTab.JSON });

    if (error && error.message) {
      tabs.push({ label: 'Error', value: InspectTab.Error });
    }

    if (dashboard.meta.canEdit) {
      tabs.push({ label: 'Query', value: InspectTab.Query });
    }
    return tabs;
  }

  render() {
    const { panel, dashboard, plugin } = this.props;
    const { currentTab } = this.state;

    if (!plugin) {
      return null;
    }

    const { last, drawerWidth } = this.state;
    const styles = getPanelInspectorStyles();
    const error = last?.error;
    const tabs = this.getTabs();

    // Validate that the active tab is actually valid and allowed
    let activeTab = currentTab;
    if (!tabs.find(item => item.value === currentTab)) {
      activeTab = InspectTab.JSON;
    }

    return (
      <Drawer
        title={panel.title || 'Panel inspect'}
        subtitle={this.drawerSubtitle(tabs, activeTab)}
        width={drawerWidth}
        onClose={this.onClose}
        expandable
      >
        {activeTab === InspectTab.Data && this.renderDataTab()}
        <CustomScrollbar autoHeightMin="100%">
          <TabContent className={styles.tabContent}>
            {activeTab === InspectTab.Meta && this.renderMetadataInspector()}
            {activeTab === InspectTab.JSON && (
              <InspectJSONTab panel={panel} dashboard={dashboard} data={last} onClose={this.onClose} />
            )}
            {activeTab === InspectTab.Error && this.renderErrorTab(error)}
            {activeTab === InspectTab.Stats && this.renderStatsTab()}
            {activeTab === InspectTab.Query && <QueryInspector panel={panel} />}
          </TabContent>
        </CustomScrollbar>
      </Drawer>
    );
  }
}

function formatStat(stat: QueryResultMetaStat): string {
  const display = getDisplayProcessor({
    field: {
      type: FieldType.number,
      config: stat,
    },
    theme: config.theme,
  });
  return formattedValueToString(display(stat.value));
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state, props) => {
  const panelState = state.dashboard.panels[props.panel.id];
  if (!panelState) {
    return { plugin: null };
  }

  return {
    plugin: panelState.plugin,
  };
};

export const PanelInspector = connect(mapStateToProps)(PanelInspectorUnconnected);
