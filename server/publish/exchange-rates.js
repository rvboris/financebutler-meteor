Meteor.publish('exchangeRates', () => {
  return G.ExchangeRatesCollection.find();
});
