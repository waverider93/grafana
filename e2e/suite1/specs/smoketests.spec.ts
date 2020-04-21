import { e2e } from '@grafana/e2e';

e2e.scenario({
  describeName: 'Smoke tests',
  itName: 'Login scenario, create test data source, dashboard, panel, and export scenario',
  addScenarioDataSource: true,
  addScenarioDashBoard: true,
  skipScenario: false,
  scenario: () => {
    // @todo remove `@ts-ignore` when possible
    // @ts-ignore
    e2e.getScenarioContext().then(({ lastAddedDashboardUid }) => {
      e2e.flows.openDashboard(lastAddedDashboardUid);
    });
    e2e.pages.Dashboard.Toolbar.toolbarItems('Add panel').click();
    e2e.pages.AddDashboard.ctaButtons('Add Query').click();

    e2e.components.DataSource.TestData.QueryTab.scenarioSelect().select('CSV Metric Values');

    // Make sure the graph renders via checking legend
    e2e.components.Panels.Visualization.Graph.Legend.legendItemAlias('A-series').should('be.visible');

    // Expand options section
    e2e.components.Panels.Visualization.Graph.VisualizationTab.legendSection().click();

    // Disable legend
    e2e.components.Panels.Visualization.Graph.Legend.showLegendSwitch().click();

    e2e.components.Panels.Visualization.Graph.Legend.legendItemAlias('A-series').should('not.exist');
  },
});
