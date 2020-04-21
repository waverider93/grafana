import React, { PureComponent } from 'react';
import { dateTime } from '@grafana/data';
import { Forms, Form } from '@grafana/ui';
import { connect, MapDispatchToProps, MapStateToProps } from 'react-redux';
import { ImportDashboardForm } from './ImportDashboardForm';
import { resetDashboard, saveDashboard } from '../state/actions';
import { DashboardInputs, DashboardSource, ImportDashboardDTO } from '../state/reducers';
import { StoreState } from 'app/types';

interface OwnProps {}

interface ConnectedProps {
  dashboard: ImportDashboardDTO;
  inputs: DashboardInputs;
  source: DashboardSource;
  meta?: any;
  folderId: number;
}

interface DispatchProps {
  resetDashboard: typeof resetDashboard;
  saveDashboard: typeof saveDashboard;
}

type Props = OwnProps & ConnectedProps & DispatchProps;

interface State {
  uidReset: boolean;
}

class ImportDashboardOverviewUnConnected extends PureComponent<Props, State> {
  state: State = {
    uidReset: false,
  };

  onSubmit = (form: ImportDashboardDTO) => {
    this.props.saveDashboard(form);
  };

  onCancel = () => {
    this.props.resetDashboard();
  };

  onUidReset = () => {
    this.setState({ uidReset: true });
  };

  render() {
    const { dashboard, inputs, meta, source, folderId } = this.props;
    const { uidReset } = this.state;

    return (
      <>
        {source === DashboardSource.Gcom && (
          <div style={{ marginBottom: '24px' }}>
            <div>
              <Forms.Legend>
                Importing Dashboard from{' '}
                <a
                  href={`https://grafana.com/dashboards/${dashboard.gnetId}`}
                  className="external-link"
                  target="_blank"
                >
                  Grafana.com
                </a>
              </Forms.Legend>
            </div>
            <table className="filter-table form-inline">
              <tbody>
                <tr>
                  <td>Published by</td>
                  <td>{meta.orgName}</td>
                </tr>
                <tr>
                  <td>Updated on</td>
                  <td>{dateTime(meta.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <Form
          onSubmit={this.onSubmit}
          defaultValues={{ ...dashboard, constants: [], dataSources: [], folderId }}
          validateOnMount
          validateFieldsOnMount={['title', 'uid']}
          validateOn="onChange"
        >
          {({ register, errors, control, getValues }) => (
            <ImportDashboardForm
              register={register}
              errors={errors}
              control={control}
              getValues={getValues}
              uidReset={uidReset}
              inputs={inputs}
              onCancel={this.onCancel}
              onUidReset={this.onUidReset}
              onSubmit={this.onSubmit}
              initialFolderId={folderId}
            />
          )}
        </Form>
      </>
    );
  }
}

const mapStateToProps: MapStateToProps<ConnectedProps, OwnProps, StoreState> = (state: StoreState) => ({
  dashboard: state.importDashboard.dashboard,
  meta: state.importDashboard.meta,
  source: state.importDashboard.source,
  inputs: state.importDashboard.inputs,
  folderId: state.location.routeParams.folderId ? Number(state.location.routeParams.folderId) : 0,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  resetDashboard,
  saveDashboard,
};

export const ImportDashboardOverview = connect(mapStateToProps, mapDispatchToProps)(ImportDashboardOverviewUnConnected);
ImportDashboardOverview.displayName = 'ImportDashboardOverview';
