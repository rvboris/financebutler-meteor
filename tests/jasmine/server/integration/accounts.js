describe('accounts', () => {
  let login;
  let password;
  let testUserId;

  let currencyRUB;
  let currencyUSD;
  let currencyEUR;

  beforeAll(() => {
    login = 'test@accounts';
    password = 'test@accounts';

    testUserId = Accounts.createUser({
      email: login,
      password: password,
      profile: {
        utfOffset: 180,
        language: 'ru',
      },
    });

    currencyRUB = G.CurrenciesCollection.findOne({ code: 'RUB' });
    currencyUSD = G.CurrenciesCollection.findOne({ code: 'USD' });
    currencyEUR = G.CurrenciesCollection.findOne({ code: 'EUR' });
    currencyJOD = G.CurrenciesCollection.findOne({ code: 'JOD' });

    Meteor.call('ExchangeRates/Update');
  });

  it('create account RUB', () => {
    const newAccountId = Meteor.call('UsersAccounts/Add', testUserId, {
      name: 'Test account RUB',
      currencyId: currencyRUB,
      startBalance: 10000,
      type: 'standart',
    });

    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(newAccountId))
      .not.toBeUndefined();
    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getCurrency(newAccountId)._id)
      .toBe(currencyRUB._id);
  });

  it('create account USD', () => {
    const newAccountId = Meteor.call('UsersAccounts/Add', testUserId, {
      name: 'Test account USD',
      currencyId: currencyUSD,
      startBalance: 5000,
      type: 'standart',
    });

    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(newAccountId))
      .not.toBeUndefined();
    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getCurrency(newAccountId)._id)
      .toBe(currencyUSD._id);
  });

  it('create account EUR', () => {
    const newAccountId = Meteor.call('UsersAccounts/Add', testUserId, {
      name: 'Test account EUR',
      currencyId: currencyEUR,
      startBalance: 2000,
      type: 'standart',
    });

    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(newAccountId))
      .not.toBeUndefined();
    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getCurrency(newAccountId)._id)
      .toBe(currencyEUR._id);
  });

  it('create debt account JOD', () => {
    const newAccountId = Meteor.call('UsersAccounts/Add', testUserId, {
      name: 'Test account JOD',
      currencyId: currencyJOD,
      startBalance: -1000,
      type: 'debt',
    });

    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(newAccountId))
      .not.toBeUndefined();
    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getCurrency(newAccountId)._id)
      .toBe(currencyJOD._id);
  });

  it('get accounts by type', () => {
    const standartAccounts = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccountsByType('standart');
    const debtAccounts = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccountsByType('debt');

    expect(standartAccounts.length).toBe(5);
    expect(debtAccounts.length).toBe(1);
  });

  it('get account by max balance', () => {
    const maxBalanceAccount = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccountByMaxBalance();
    expect(maxBalanceAccount.name).toBe('Test account RUB');
  });

  it('get account by max balance', () => {
    const maxBalanceAccount = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccountByMaxBalance();
    expect(maxBalanceAccount.name).toBe('Test account RUB');
  });

  it('get simple total', () => {
    expect(Meteor.call('UsersAccounts/GetSimpleTotal', testUserId)).toBe(16000);
    expect(Meteor.call('UsersAccounts/GetSimpleTotal', testUserId, false)).toBe(17000);
  });

  it('get balance in currency', () => {
    const accountRUB = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account RUB');
    const accountUSD = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account USD');
    const accountEUR = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account EUR');
    const accountJOD = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account JOD');

    expect(Meteor.call('UsersAccounts/GetBalanceInCurrency', testUserId, accountRUB._id)).toBe(10000);
    expect(Meteor.call('UsersAccounts/GetBalanceInCurrency', testUserId, accountUSD._id)).toBeGreaterThan(5000);
    expect(Meteor.call('UsersAccounts/GetBalanceInCurrency', testUserId, accountEUR._id)).toBeGreaterThan(2000);
    expect(Meteor.call('UsersAccounts/GetBalanceInCurrency', testUserId, accountJOD._id)).toBeLessThan(-1000);
  });

  it('get currency total', () => {
    expect(Meteor.call('UsersAccounts/GetCurrencyTotal', testUserId)).toBeGreaterThan(17000);
    expect(Meteor.call('UsersAccounts/GetCurrencyTotal', testUserId, false)).toBeGreaterThan(17000);
  });

  it('update account', () => {
    let accountRUB = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account RUB');

    Meteor.call('UsersAccounts/Update', testUserId, accountRUB._id, {
      name: 'Test account RUB Updated',
      startBalance: 9000,
    });

    accountRUB = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountRUB._id);

    expect(accountRUB.name).toBe('Test account RUB Updated');
    expect(accountRUB.currentBalance).toBe(9000);
  });

  it('remove account', () => {
    const accountJOD = G.UsersAccountsCollection.findOne({ userId: testUserId }).accounts
      .find(acc => acc.name === 'Test account JOD');

    Meteor.call('UsersAccounts/Remove', testUserId, accountJOD._id);

    expect(G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountJOD._id)).toBeUndefined();
  });
});
