const namespace = 'ExchangeRates';

Meteor.methods({
  [`${namespace}/Update`]: () => {
    const apiUrl = Meteor.settings.openexchangerates.url + Meteor.settings.openexchangerates.key;

    HTTP.post(apiUrl, {}, (error, result) => {
      if (error) {
        Logstar.error(error);
        return;
      }

      fx.rates = result.data.rates;
      fx.base = result.data.base;

      G.ExchangeRatesCollection.remove({});
      G.ExchangeRatesCollection.insert(result.data);
    });
  },
});
