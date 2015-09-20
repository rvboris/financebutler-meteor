describe('users operations', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  let login;
  let password;
  let testUsersAccounts;
  let testUserId;
  let accountIdUSD;

  beforeAll(() => {
    login = 'test@operations';
    password = 'test@operations';

    testUserId = Accounts.createUser({
      email: login,
      password: password,
      profile: {
        utfOffset: 180,
        language: 'ru',
      },
    });

    accountIdUSD = Meteor.call('UsersAccounts/Add', testUserId, {
      name: 'Test USD Account',
      startBalance: 1000,
      currencyId: G.CurrenciesCollection.findOne({ code: 'USD' })._id,
      type: 'standart',
    });

    testUsersAccounts = G.UsersAccountsCollection.findOne({userId: testUserId}).accounts;
  });

  it('test user has no operations', () => {
    expect(G.UsersOperationsCollection.find({userId: testUserId}).count()).toBe(0);
  });

  it('income operation', () => {
    let accountForIncome = testUsersAccounts[0];
    const incomeAmount = 100000;
    const incomeDate = moment.utc('2015 1 5').toDate();

    jasmine.clock().mockDate(incomeDate);

    const incomeOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForIncome._id, {
      type: 'income',
      amount: incomeAmount,
    });

    const resultOperation = G.UsersOperationsCollection.findOne(incomeOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('income');
    expect(resultOperation.amount).toBe(incomeAmount);
    expect(resultOperation.balance).toBe(incomeAmount);
    expect(resultOperation.date).toEqual(incomeDate);

    accountForIncome = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForIncome._id);

    expect(accountForIncome.currentBalance).toBe(incomeAmount);
  });

  it('expense operation', () => {
    let accountForExpense = testUsersAccounts[0];
    const expenseAmount = -20000;
    const expenseDate = moment.utc('2015 1 10').toDate();

    jasmine.clock().mockDate(expenseDate);

    const expenseOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForExpense._id, {
      type: 'expense',
      amount: expenseAmount,
    });

    const resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('expense');
    expect(resultOperation.amount).toBe(expenseAmount);
    expect(resultOperation.balance).toBe(80000);
    expect(resultOperation.date).toEqual(expenseDate);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(80000);
  });

  it('transfer operation', () => {
    let accountFrom = testUsersAccounts[0];
    let accountTo = testUsersAccounts[1];
    const transferDate = moment.utc('2015 1 20').toDate();

    jasmine.clock().mockDate(transferDate);

    const amount = 10000;

    const operationFromId = Meteor.call('UsersOperations/AddTransfer', testUserId, accountFrom._id, accountTo._id, {
      amount: amount,
    });

    const resultOperationFrom = G.UsersOperationsCollection.findOne(operationFromId);
    const resultOperationTo = G.UsersOperationsCollection.findOne(resultOperationFrom.groupTo);

    expect(resultOperationFrom).not.toBeUndefined();
    expect(resultOperationFrom.groupTo).not.toBeUndefined();
    expect(resultOperationFrom.type).toBe('expense');
    expect(resultOperationFrom.amount).toBe(-amount);
    expect(resultOperationFrom.balance).toBe(70000);
    expect(resultOperationFrom.date).toEqual(transferDate);

    expect(resultOperationTo).not.toBeUndefined();
    expect(resultOperationTo.groupTo).not.toBeUndefined();
    expect(resultOperationTo.type).toBe('income');
    expect(resultOperationTo.amount).toBe(amount);
    expect(resultOperationTo.balance).toBe(amount);
    expect(resultOperationTo.date).toEqual(transferDate);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(70000);
    expect(accountTo.currentBalance).toBe(amount);
  });

  it('insert expense operation at middle', () => {
    let accountForExpense = testUsersAccounts[0];
    const expenseAmount = -5000;
    const expenseDate = moment.utc('2015 1 6').toDate();

    jasmine.clock().mockDate(expenseDate);

    const expenseOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForExpense._id, {
      type: 'expense',
      amount: expenseAmount,
    });

    const resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('expense');
    expect(resultOperation.amount).toBe(expenseAmount);
    expect(resultOperation.balance).toBe(95000);
    expect(resultOperation.date).toEqual(expenseDate);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(65000);
  });

  it('insert income operation at start', () => {
    let accountForIncome = testUsersAccounts[0];
    const incomeAmount = 3000;
    const incomeDate = moment.utc('2015 1 4').toDate();

    jasmine.clock().mockDate(incomeDate);

    const incomeOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForIncome._id, {
      type: 'income',
      amount: incomeAmount,
    });

    const resultOperation = G.UsersOperationsCollection.findOne(incomeOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('income');
    expect(resultOperation.amount).toBe(incomeAmount);
    expect(resultOperation.balance).toBe(incomeAmount);
    expect(resultOperation.date).toEqual(incomeDate);

    accountForIncome = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForIncome._id);

    expect(accountForIncome.currentBalance).toBe(68000);
  });

  it('remove operation', () => {
    let accountForExpense = testUsersAccounts[0];
    const expenseAmount = -2000;
    const expenseDate = moment.utc('2015 1 9').toDate();

    jasmine.clock().mockDate(expenseDate);

    const expenseOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForExpense._id, {
      type: 'expense',
      amount: expenseAmount,
    });

    const resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('expense');
    expect(resultOperation.amount).toBe(expenseAmount);
    expect(resultOperation.balance).toBe(96000);
    expect(resultOperation.date).toEqual(expenseDate);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(66000);

    Meteor.call('UsersOperations/Remove', testUserId, expenseOperationId);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(68000);
  });

  it('remove transfer operation (from)', () => {
    let accountFrom = testUsersAccounts[0];
    let accountTo = testUsersAccounts[1];
    const transferDate = moment.utc('2015 1 15').toDate();

    jasmine.clock().mockDate(transferDate);

    const amount = 10000;

    const operationFromId = Meteor.call('UsersOperations/AddTransfer', testUserId, accountFrom._id, accountTo._id, {
      amount: amount,
    });

    const resultOperationFrom = G.UsersOperationsCollection.findOne(operationFromId);
    const resultOperationTo = G.UsersOperationsCollection.findOne(resultOperationFrom.groupTo);

    expect(resultOperationFrom).not.toBeUndefined();
    expect(resultOperationFrom.groupTo).not.toBeUndefined();
    expect(resultOperationFrom.type).toBe('expense');
    expect(resultOperationFrom.amount).toBe(-amount);
    expect(resultOperationFrom.balance).toBe(68000);
    expect(resultOperationFrom.date).toEqual(transferDate);

    expect(resultOperationTo).not.toBeUndefined();
    expect(resultOperationTo.groupTo).not.toBeUndefined();
    expect(resultOperationTo.type).toBe('income');
    expect(resultOperationTo.amount).toBe(amount);
    expect(resultOperationTo.balance).toBe(amount);
    expect(resultOperationTo.date).toEqual(transferDate);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(58000);
    expect(accountTo.currentBalance).toBe(20000);

    Meteor.call('UsersOperations/Remove', testUserId, resultOperationFrom._id);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(68000);
    expect(accountTo.currentBalance).toBe(10000);
  });

  it('remove transfer operation (to)', () => {
    let accountFrom = testUsersAccounts[0];
    let accountTo = testUsersAccounts[1];
    const transferDate = moment.utc('2015 1 16').toDate();

    jasmine.clock().mockDate(transferDate);

    const amount = 10000;

    const operationFromId = Meteor.call('UsersOperations/AddTransfer', testUserId, accountFrom._id, accountTo._id, {
      amount: amount,
    });

    const resultOperationFrom = G.UsersOperationsCollection.findOne(operationFromId);
    const resultOperationTo = G.UsersOperationsCollection.findOne(resultOperationFrom.groupTo);

    expect(resultOperationFrom).not.toBeUndefined();
    expect(resultOperationFrom.groupTo).not.toBeUndefined();
    expect(resultOperationFrom.type).toBe('expense');
    expect(resultOperationFrom.amount).toBe(-amount);
    expect(resultOperationFrom.balance).toBe(68000);
    expect(resultOperationFrom.date).toEqual(transferDate);

    expect(resultOperationTo).not.toBeUndefined();
    expect(resultOperationTo.groupTo).not.toBeUndefined();
    expect(resultOperationTo.type).toBe('income');
    expect(resultOperationTo.amount).toBe(amount);
    expect(resultOperationTo.balance).toBe(amount);
    expect(resultOperationTo.date).toEqual(transferDate);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(58000);
    expect(accountTo.currentBalance).toBe(20000);

    Meteor.call('UsersOperations/Remove', testUserId, resultOperationTo._id);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(68000);
    expect(accountTo.currentBalance).toBe(10000);
  });

  it('update operation date', () => {
    let accountForExpense = testUsersAccounts[0];
    const expenseAmount = -3000;
    const expenseDate = moment.utc('2015 1 21').toDate();

    jasmine.clock().mockDate(expenseDate);

    const expenseOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForExpense._id, {
      type: 'expense',
      amount: expenseAmount,
    });

    let resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('expense');
    expect(resultOperation.amount).toBe(expenseAmount);
    expect(resultOperation.balance).toBe(65000);
    expect(resultOperation.date).toEqual(expenseDate);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(65000);

    Meteor.call('UsersOperations/Update', testUserId, expenseOperationId, {
      date: moment.utc('2015 1 8').toDate(),
    });

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(65000);

    resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation.balance).toBe(95000);
  });

  it('update operation account', () => {
    let accountForExpense = testUsersAccounts[0];
    const expenseAmount = -3000;
    const expenseDate = moment.utc('2015 1 25').toDate();

    jasmine.clock().mockDate(expenseDate);

    const expenseOperationId = Meteor.call('UsersOperations/Add', testUserId, accountForExpense._id, {
      type: 'expense',
      amount: expenseAmount,
    });

    let resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation).not.toBeUndefined();
    expect(resultOperation.type).toBe('expense');
    expect(resultOperation.amount).toBe(expenseAmount);
    expect(resultOperation.balance).toBe(62000);
    expect(resultOperation.date).toEqual(expenseDate);

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(62000);

    Meteor.call('UsersOperations/Update', testUserId, expenseOperationId, {
      accountId: testUsersAccounts[1]._id,
    });

    accountForExpense = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountForExpense._id);

    expect(accountForExpense.currentBalance).toBe(65000);

    resultOperation = G.UsersOperationsCollection.findOne(expenseOperationId);

    expect(resultOperation.balance).toBe(7000);

    const accountToChange = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(testUsersAccounts[1]._id);

    expect(accountToChange.currentBalance).toBe(7000);
  });

  it('get day normal balance', () => {
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 3').toDate())).toBe(0);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 4').toDate())).toBe(0);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 5').toDate())).toBe(3000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 6').toDate())).toBe(103000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 7').toDate())).toBe(98000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 8').toDate())).toBe(98000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 9').toDate())).toBe(95000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 10').toDate())).toBe(95000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2015 1 20').toDate())).toBe(75000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[0]._id, moment.utc('2020 1 25').toDate())).toBe(65000);

    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[1]._id, moment.utc('2015 1 20').toDate())).toBe(0);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[1]._id, moment.utc('2015 1 21').toDate())).toBe(10000);
    expect(Meteor.call('UsersOperations/GetBalanceForDate', testUserId, testUsersAccounts[1]._id, moment.utc('2015 1 26').toDate())).toBe(7000);
  });

  it('transfer operation in different currency (from)', () => {
    let accountFrom = testUsersAccounts[0];
    let accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountIdUSD);
    const transferDate = moment.utc('2015 1 27').toDate();

    jasmine.clock().mockDate(transferDate);

    const amount = 10000;
    const amountUSD = parseFloat(new Big(amount).div(fx.rates.RUB).toFixed(2));

    const operationFromId = Meteor.call('UsersOperations/AddTransfer', testUserId, accountFrom._id, accountTo._id, {
      amount: {
        from: amount,
      },
    });

    const resultOperationFrom = G.UsersOperationsCollection.findOne(operationFromId);
    const resultOperationTo = G.UsersOperationsCollection.findOne(resultOperationFrom.groupTo);

    expect(resultOperationFrom).not.toBeUndefined();
    expect(resultOperationFrom.groupTo).not.toBeUndefined();
    expect(resultOperationFrom.type).toBe('expense');
    expect(resultOperationFrom.amount).toBe(-amount);
    expect(resultOperationFrom.balance).toBe(55000);
    expect(resultOperationFrom.date).toEqual(transferDate);

    expect(resultOperationTo).not.toBeUndefined();
    expect(resultOperationTo.groupTo).not.toBeUndefined();
    expect(resultOperationTo.type).toBe('income');
    expect(resultOperationTo.amount).toBe(amountUSD);
    expect(resultOperationTo.balance).toBe(parseFloat(new Big(accountTo.startBalance).plus(amountUSD).toFixed(2)));
    expect(resultOperationTo.date).toEqual(transferDate);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(55000);
    expect(accountTo.currentBalance).toBe(parseFloat(new Big(accountTo.startBalance).plus(amountUSD).toFixed(2)));
  });

  it('transfer operation in different currency (to)', () => {
    let accountFrom = testUsersAccounts[0];
    let accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountIdUSD);
    const transferDate = moment.utc('2015 1 28').toDate();

    jasmine.clock().mockDate(transferDate);

    const amount = 10000;
    const amountUSD = parseFloat(new Big(amount).div(fx.rates.RUB).toFixed(2));

    const operationFromId = Meteor.call('UsersOperations/AddTransfer', testUserId, accountFrom._id, accountTo._id, {
      amount: {
        to: amountUSD,
      },
    });

    const resultOperationFrom = G.UsersOperationsCollection.findOne(operationFromId);
    const resultOperationTo = G.UsersOperationsCollection.findOne(resultOperationFrom.groupTo);

    expect(resultOperationFrom).not.toBeUndefined();
    expect(resultOperationFrom.groupTo).not.toBeUndefined();
    expect(resultOperationFrom.type).toBe('expense');
    expect(resultOperationFrom.amount).toBe(parseFloat(new Big(amountUSD).times(fx.rates.RUB).times(-1).toFixed(2)));
    expect(resultOperationFrom.balance).toBe(parseFloat(new Big(55000).minus(new Big(amountUSD).times(fx.rates.RUB)).toFixed(2)));
    expect(resultOperationFrom.date).toEqual(transferDate);

    expect(resultOperationTo).not.toBeUndefined();
    expect(resultOperationTo.groupTo).not.toBeUndefined();
    expect(resultOperationTo.type).toBe('income');
    expect(resultOperationTo.amount).toBe(amountUSD);
    expect(resultOperationTo.balance).toBe(parseFloat(new Big(accountTo.startBalance).plus(new Big(amountUSD).times(2)).toFixed(2)));
    expect(resultOperationTo.date).toEqual(transferDate);

    accountFrom = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountFrom._id);
    accountTo = G.UsersAccountsCollection.findOne({ userId: testUserId }).getAccount(accountTo._id);

    expect(accountFrom.currentBalance).toBe(parseFloat(new Big(55000).minus(new Big(amountUSD).times(fx.rates.RUB)).toFixed(2)));
    expect(accountTo.currentBalance).toBe(parseFloat(new Big(accountTo.startBalance).plus(new Big(amountUSD).times(2)).toFixed(2)));
  });
});
