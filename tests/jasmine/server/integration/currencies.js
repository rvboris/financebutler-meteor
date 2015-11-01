describe('currencies', () => {
  it('should load default currencies', () => {
    expect(G.CurrenciesCollection.find().count()).toBe(118);
  });
});
