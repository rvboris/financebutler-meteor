const namespace = 'ExchangeRates';

Meteor.methods({
  [`${namespace}/Update`]: () => {
    const apiUrl = Meteor.settings.openexchangerates.url + Meteor.settings.openexchangerates.key;
    let result;

    try {
      result = HTTP.post(apiUrl);
    } catch (e) {
      Logstar.error(e);
      result = {};
      result.data = G.ExchangeRatesFixture;
    }

    fx.rates = result.data.rates;
    fx.base = result.data.base;

    G.ExchangeRatesCollection.remove({});
    G.ExchangeRatesCollection.insert(result.data);

    Logstar.info('Exchange rates updated');
  },
});
