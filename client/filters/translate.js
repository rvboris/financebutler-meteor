SetModule('app');

@Filter('translate')
@Inject(['$parse', '$log'])

export class translate {
  constructor($parse, $log) {
    return (key, options) => {
      if (!Session.get('translateReady')) {
        return '';
      }

      let parsedOptions;

      if (!angular.isObject(options)) {
        parsedOptions = $parse(options)(this);
      }

      try {
        const translated = TAPi18n.__(key, parsedOptions);

        if (translated.includes(key)) {
          return TAPi18n.__('APP.UNKNOWN_ERROR');
        }

        return translated;
      } catch (err) {
        $log.error(err);
      }

      return '';
    };
  }
}
