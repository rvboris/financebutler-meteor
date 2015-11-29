SetModule('app');

@Filter('currency')
@Inject(['$rootScope'])

export class currency {
  constructor($rootScope) {
    return (value, currencyId) => {
      if (_.isUndefined(value) || (!currencyId && !$rootScope.currentUser)) {
        return '';
      }

      const currencyToUse = currencyId ? currencyId : $rootScope.currentUser.profile.currencyId;
      const currency = G.CurrenciesCollection.findOne(currencyToUse);

      const options = {
        symbol: currency.symbolNative,
        precision: currency.decimalDigits,
        format: '%v %s',
      };

      return accounting.formatMoney(value, options);
    };
  }
}
