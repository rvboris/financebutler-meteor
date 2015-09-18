SetModule('app');

@Filter('dashboardBreadcrumb')
@Inject(['$filter'])

export class dashboardBreadcrumb {
  constructor($filter) {
    return (stateName) => {
      if (!stateName) {
        return '';
      }

      return $filter('translate')(`STATE.${stateName.replace(/\./g, '_').toUpperCase()}`);
    };
  }
}
