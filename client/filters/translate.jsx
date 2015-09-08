SetModule('app');

@Filter('translate')
@Inject(['$parse', '$log', '$rootScope'])

export class translate {
  constructor($parse, $log, $rootScope) {
    return (key, options) => {
      if (!$rootScope.translateReady) {
        return '';
      }

      let parsedOptions;

      if (!angular.isObject(options)) {
        parsedOptions = $parse(options)(this);
      }

      try {
        return TAPi18n.__(key, parsedOptions);
      } catch (err) {
        $log.error(err);
      }
    };
  }
}
