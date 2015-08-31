SetModule('app');

@Filter('translate')
@Inject(['$parse', '$log', '$rootScope'])

class translate {
  constructor ($parse, $log, $rootScope) {
    return function(key, options) {
      if (!$rootScope.translateReady) {
        return '';
      }

      if (!angular.isObject(options)) {
        options = $parse(options)(this);
      }

      try {
        return TAPi18n.__(key, options);
      } catch (err) {
        $log.error(err);
      }
    }
  }
}
