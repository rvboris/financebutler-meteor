SetModule('app');

@Filter('currency')
@Inject(['$rootScope'])

export class currency {
  constructor($rootScope) {
    return (value, currencyId) => {
      if (_.isUndefined(value) || (!currencyId && !$rootScope.currentUser)) {
        return '';
      }

      const currency = G.CurrenciesCollection.findOne(currencyId ? currencyId : $rootScope.currentUser.profile.currencyId);

      const options = {
        symbol: currency.symbolNative,
        precision: currency.decimalDigits,
        format: '%v %s',
      };

      return accounting.formatMoney(value, options);
    };
  }
}
