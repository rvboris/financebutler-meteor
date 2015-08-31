'use strict';

G.UserGenerator = (email, password, profile) => {
  Logstar.info(`User generation start for ${email}`);

  let userId = Accounts.createUser({
    email: email,
    password: password,
    profile: profile || {
      utcOffset: 180,
      language: 'ru'
    }
  });

  Logstar.info('Create additional accounts');

  let demoAccountYears = 3
    , debtAccountId = Random.id()
    , debtAmount = _.random(demoAccountYears * 50000, demoAccountYears * 80000)
    , debtMonthlyPay = _.round(debtAmount / (demoAccountYears * 12));

  Meteor.call('addUserAccount', userId, {
    name: 'Credit',
    currencyId: G.CurrenciesCollection.findOne({ code: 'RUB' })._id,
    startBalance: debtAmount * -1,
    type: 'debt',
    _id: debtAccountId
  });

  let flatCategories = G.UsersCategoriesCollection
    .findOne({ userId })
    .getFlatCategories();

  let standartAccounts = G.UsersAccountsCollection
    .findOne({ userId })
    .getAccountsByType('standart');

  let getRandomCategoryId = type => {
    let categoriesForType = _.filter(flatCategories, category => {
      return category.type === type;
    });

    return _.sample(categoriesForType)._id;
  };

  let mutateOperationBalance = (type, amount) => {
    if (type === 'income') {
      return _.random(amount, amount + _.random(1, amount))
    }

    return _.random(amount, amount - _.random(1, amount));
  };

  let mutateCurrentDayTime = (day) => {
    return day
      .add(_.random(1, 23), 'hour')
      .add(_.random(1, 59), 'minute')
      .add(_.random(1, 59), 'second')
      .toDate();
  };

  let getRandomDate = () => {
    return moment()
      .subtract(demoAccountYears, 'year')
      .add(_.random(1, demoAccountYears * 365), 'days')
      .add(_.random(1, 23), 'hour')
      .add(_.random(1, 59), 'minute')
      .add(_.random(1, 59), 'second')
      .toDate();
  };

  Logstar.info('Generate operations');

  let startDate = moment().subtract(demoAccountYears, 'year');
  let endDate = moment();
  let currentDate = startDate;

  let sumIncome = 0
    , sumExpense = 0
    , sumDebt = 0
    , sumTransfer = 0
    , hungryDays = 0;

  while (currentDate < endDate) {
    let currentDay = _.parseInt(currentDate.format('D'))
      , incomeDay1 = _.random(1, 3)
      , incomeDay1Amount = _.random(20000, 22000)
      , incomeDay2 = _.random(25, 28)
      , incomeDay2Amount = _.random(350000, 38000)
      , dailyExpenseSum = 0
      , transferDays = _.sample(_.range(_.random(1, currentDate.daysInMonth()), currentDate.daysInMonth()), _.random(1, 5));

    standartAccounts = _.shuffle(standartAccounts);

    let transferAccounts = {
      from: standartAccounts[0]._id,
      to: standartAccounts[1]._id
    };

    for (let currentDay = 1; currentDay <= currentDate.daysInMonth(); currentDay++) {
      if (currentDay === incomeDay1) {
        Meteor.call('addUserOperation', userId, _.sample(standartAccounts)._id, {
          type: 'income',
          amount: incomeDay1Amount,
          date: mutateCurrentDayTime(currentDate),
          categoryId: getRandomCategoryId('income')
        });

        sumIncome += incomeDay1Amount;
      }

      if (currentDay === incomeDay2) {
        Meteor.call('addUserOperation', userId, _.sample(standartAccounts)._id, {
          type: 'income',
          amount: incomeDay2Amount,
          date: mutateCurrentDayTime(currentDate),
          categoryId: getRandomCategoryId('income')
        });

        sumIncome += incomeDay2Amount;
      }

      let dailyExpense = _.random(1000, incomeDay1Amount + incomeDay2Amount)
        , dailyExpenseCount = _.random(1, 10);

      if (sumExpense + debtMonthlyPay < incomeDay1Amount + incomeDay2Amount) {
        let expenseAccount = G.UsersAccountsCollection
          .findOne({ userId })
          .getAccountByMaxBalance();

        if (expenseAccount.currentBalance - dailyExpense >= 0) {
          for (let i = 0; i < dailyExpenseCount; i++) {
            let roundedExpense = _.round(dailyExpense / dailyExpenseCount);

            dailyExpenseSum += roundedExpense;

            let expenseOperation = Meteor.call('addUserOperation', userId, expenseAccount._id, {
              type: 'expense',
              amount: roundedExpense * -1,
              date: mutateCurrentDayTime(currentDate),
              categoryId: getRandomCategoryId('expense')
            });
          }
        } else {
          hungryDays++;
        }
      }

      if (transferDays.indexOf(currentDay) >= 0) {
        let fromAccountBalance = G.UsersAccountsCollection
          .findOne({ userId })
          .getAccount(transferAccounts.from)
          .currentBalance;

        if (fromAccountBalance >= 1) {
          let transferAmount = _.random(1, fromAccountBalance);

          sumTransfer += transferAmount;

          Meteor.call('addTransferUserOperation', userId, transferAccounts.from, transferAccounts.to, {
            amount: transferAmount,
            date: mutateCurrentDayTime(currentDate),
          });
        }
      }

      currentDate.startOf('day');
      currentDate.add(1, 'day');
    }

    let payDebtAccount =  G.UsersAccountsCollection
      .findOne({ userId })
      .getAccountByMaxBalance();

    let debtAccountBalance = G.UsersAccountsCollection
      .findOne({ userId })
      .getAccount(debtAccountId).currentBalance;

    if (debtAccountBalance < 0 && payDebtAccount.currentBalance > 0) {
      let payDebtAmount = payDebtAccount.currentBalance > debtMonthlyPay ? payDebtAccount.currentBalance : debtMonthlyPay;
      payDebtAmount = (debtAccountBalance * -1) < payDebtAmount ? (debtAccountBalance * -1) : payDebtAmount;

      sumDebt += payDebtAmount;

      Meteor.call('addTransferUserOperation', userId, payDebtAccount._id, debtAccountId, {
        amount: payDebtAmount,
        date: currentDate.toDate(),
      });
    }

    sumExpense += dailyExpenseSum;

    currentDate.startOf('month');
    currentDate.add(1, 'month');
  }

  let insertOperationsCount = _.random(10, 20);

  for (var i = 0; i < insertOperationsCount; i++) {
    let account =  _.sample(G.UsersAccountsCollection.findOne({ userId: userId }).getAccountsByType('standart'))._id;
    let type = _.sample(['income', 'expense']);
    let amount = _.random(100, 3000);

    Meteor.call('addUserOperation', userId, account, {
      type,
      amount: amount * (type === 'expense' ? -1 : 1),
      date: getRandomDate(),
      categoryId: getRandomCategoryId(type)
    });

    if (type === 'income') {
      sumIncome += amount;
    } else {
      sumExpense += amount;
    }
  }

  Logstar.info(`Test user operations`);

  let getOperationsToUpdate = (transfer = false) => {
    return G.UsersOperationsCollection
      .find({ dayBalance: { $exists: false }, groupTo: { $exists: transfer } })
      .fetch();
  }

  let totalUpdates = 0;
  let totalTransferUpdates = 0;

  let operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  let operationsCount = operationsToUpdate.length;

  Logstar.info('Update operations dates');

  operationsToUpdate.forEach(operation => {
    Meteor.call('updateUserOperation', userId, operation._id, {
      date: getRandomDate()
    });

    totalUpdates++;
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Update operations amounts');

  operationsToUpdate.forEach(operation => {
    let newAmount = mutateOperationBalance(operation.type, operation.amount);

    Meteor.call('updateUserOperation', userId, operation._id, {
      amount: newAmount
    });

    if (operation.type === 'expense') {
      sumExpense -= newAmount - operation.amount;
    } else {
      sumIncome += newAmount - operation.amount;
    }

    totalUpdates++;
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Update operations categories');

  operationsToUpdate.forEach(operation => {
    Meteor.call('updateUserOperation', userId, operation._id, {
      categoryId: getRandomCategoryId(operation.type)
    });

    totalUpdates++;
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Update operations accounts');

  operationsToUpdate.forEach(operation => {
    let accountIds = G.UsersAccountsCollection
      .findOne({ userId: userId })
      .getAccountsByType('standart')
      .map(account => account._id);

    let accountToMove = _.difference(accountIds, [operation.accountId])[0];

    Meteor.call('updateUserOperation', userId, operation._id, {
      accountId: accountToMove
    });

    totalUpdates++;
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Update operations wholly');

  operationsToUpdate.forEach(operation => {
    let newAmount =  mutateOperationBalance(operation.type, operation.amount);

    let accountIds = G.UsersAccountsCollection
      .findOne({ userId: userId })
      .getAccountsByType('standart')
      .map(account => account._id);

    let accountToMove = _.difference(accountIds, [operation.accountId])[0];

    Meteor.call('updateUserOperation', userId, operation._id, {
      date: getRandomDate(),
      accountId: accountToMove,
      amount: newAmount,
      categoryId: getRandomCategoryId(operation.type)
    });

    if (operation.type === 'expense') {
      sumExpense -= newAmount - operation.amount;
    } else {
      sumIncome += newAmount - operation.amount;
    }

    totalUpdates++;
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Remove single operations');

  operationsToUpdate.forEach(operation => {
    Meteor.call('removeUserOperation', userId, operation._id);

    if (operation.type === 'expense') {
      sumExpense += operation.amount;
    } else {
      sumIncome -= operation.amount;
    }
  });

  operationsToUpdate = _.sample(getOperationsToUpdate(true), _.random(10, 20));
  operationsCount = operationsToUpdate.length;

  Logstar.info('Remove transfer operations');

  operationsToUpdate.forEach(operation => {
    Meteor.call('removeUserOperation', userId, operation._id);

    if (operation.type === 'expense') {
      sumExpense += operation.amount;
    } else {
      sumIncome -= operation.amount;
    }
  });

  // operationsToUpdate = _.sample(getOperationsToUpdate(true), _.random(10, 20));
  // operationsCount = operationsToUpdate.length;
  //
  // Logstar.info('Update transfer operations wholly');
  //
  // operationsToUpdate.forEach(operation => {
  //   let newAmount =  mutateOperationBalance(operation.type, operation.amount);
  //
  //   let accountIds = G.UsersAccountsCollection
  //     .findOne({ userId: userId })
  //     .getAccountsByType('standart')
  //     .map(account => account._id);
  //
  //   let accountToMove = _.difference(accountIds, [operation.accountId])[0];
  //
  //   Meteor.call('updateTransferUserOperation', userId, operation._id, {
  //     date: getRandomDate(),
  //     accountId: accountToMove,
  //     amount: newAmount
  //   });
  //
  //   if (operation.type === 'expense') {
  //     sumExpense += newAmount - operation.amount;
  //   } else {
  //     sumIncome -= newAmount - operation.amount;
  //   }
  //
  //   totalTransferUpdates++;
  // });

  let totalCheck = sumIncome - sumExpense - sumDebt - Meteor.call('getUsersAccountsTotals', userId);

  Logstar.info(`--- Generated user stats ---`);
  Logstar.info(`Total income ${sumIncome}`);
  Logstar.info(`Total expense ${sumExpense}`);
  Logstar.info(`Total transfer ${sumTransfer}`);
  Logstar.info(`Debt paid ${sumDebt} of ${debtAmount}, left ${debtAmount - sumDebt}`);
  Logstar.info(`Hungry days ${hungryDays}`);
  Logstar.info(`Total updates ${totalUpdates}`);
  Logstar.info(`Total transfer updates ${totalTransferUpdates}`);
  Logstar.info(`Total check ${totalCheck === 0 ? 'OK' : 'FAIL'} (${totalCheck})`);
  Logstar.info(`--- Generated user stats ---`);
  Logstar.info(`User generation end for ${email}`);
}
