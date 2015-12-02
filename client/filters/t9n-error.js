SetModule('app');

@Filter('t9nError')
@Inject(['$filter'])

export class translate {
  constructor($filter) {
    return (key) => {
      if (!Session.get('translateReady')) {
        return '';
      }

      const translated = T9n.get(key);

      if (translated.includes(key)) {
        return $filter('translate')('APP.UNKNOWN_ERROR');
      }

      return translated;
    };
  }
}
