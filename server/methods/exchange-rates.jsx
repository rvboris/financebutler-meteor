const namespace = 'ExchangeRates';

Meteor.methods({
  [`${namespace}/Update`]: () => {
    const apiUrl = Meteor.settings.openexchangerates.url + Meteor.settings.openexchangerates.key;
    const result = HTTP.post(apiUrl);

    fx.rates = result.data.rates;
    fx.base = result.data.base;

    G.ExchangeRatesCollection.remove({});
    G.ExchangeRatesCollection.insert(result.data);

    Logstar.info('Exchange rates updated');
  },
});
