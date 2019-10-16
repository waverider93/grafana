// Libraries
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Utils and services
import coreModule from 'app/core/core_module';
import { store } from 'app/store/store';
import { ContextSrv } from 'app/core/services/context_srv';
import { provideTheme } from 'app/core/utils/ConfigProvider';
import { ErrorBoundaryAlert } from '@grafana/ui';
import { GrafanaRootScope } from './GrafanaCtrl';
import appEvents from '../core/app_events';
import { AppEvents } from '@grafana/data';

// Check to see if browser is not supported by Grafana
// IE11 and older
// Older versions of Firefox
function checkBrowserCompatibility() {
  if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
    return false;
  }

  return true;
}

function WrapInProvider(store: any, Component: any, props: any) {
  if (checkBrowserCompatibility()) {
    appEvents.emit(AppEvents.alertWarning, ['Your browser is not supported']);
  }

  return (
    <Provider store={store}>
      <ErrorBoundaryAlert style="page">
        <Component {...props} />
      </ErrorBoundaryAlert>
    </Provider>
  );
}

/** @ngInject */
export function reactContainer(
  $route: any,
  $location: any,
  $injector: any,
  $rootScope: GrafanaRootScope,
  contextSrv: ContextSrv
) {
  return {
    restrict: 'E',
    template: '',
    link(scope: any, elem: JQuery) {
      // Check permissions for this component
      const roles: string[] = $route.current.locals.roles;
      if (roles && roles.length) {
        if (!roles.some(r => contextSrv.hasRole(r))) {
          $location.url('/');
        }
      }

      let { component } = $route.current.locals;
      // Dynamic imports return whole module, need to extract default export
      if (component.default) {
        component = component.default;
      }

      const props = {
        $injector: $injector,
        $rootScope: $rootScope,
        $scope: scope,
        $contextSrv: contextSrv,
        routeInfo: $route.current.$$route.routeInfo,
      };

      document.body.classList.add('is-react');

      ReactDOM.render(WrapInProvider(store, provideTheme(component), props), elem[0]);

      scope.$on('$destroy', () => {
        document.body.classList.remove('is-react');
        ReactDOM.unmountComponentAtNode(elem[0]);
      });
    },
  };
}

coreModule.directive('reactContainer', reactContainer);
