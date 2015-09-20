class UserGenerator {
  constructor(email, password, profile, years = 3) {
    Logstar.info(`User generation start for ${email}`);

    this.currency = G.CurrenciesCollection.findOne({ code: 'RUB' });

    this.userId = Accounts.createUser({
      email: email,
      password: password,
      profile: profile || {
        utcOffset: 180,
        language: 'ru',
        currencyId: this.currency._id,
      },
    });

    this.demoAccountYears = years;

    this.addCreditAccount();

    this.flatCategories = G.UsersCategoriesCollection
      .findOne({ userId: this.userId })
      .getFlatCategories();

    this.standartAccounts = G.UsersAccountsCollection
      .findOne({ userId: this.userId })
      .getAccountsByType('standart');

    Logstar.info('Generate operations');

    this.startDate = moment.utc().subtract(this.demoAccountYears, 'year');
    this.endDate = moment.utc();
    this.currentDate = this.startDate;

    this.sumIncome = new Big(0);
    this.hungryDays = new Big(0);
    this.sumExpense = new Big(0);
    this.sumDebt = new Big(0);
    this.sumTransfer = new Big(0);

    while (this.currentDate < this.endDate) {
      this.incomeDay1 = _.random(1, 3);
      this.incomeDay1Amount = _.random(20000, 22000);
      this.incomeDay2 = _.random(25, 28);
      this.incomeDay2Amount = _.random(350000, 38000);
      this.transferDays = _.sample(_.range(_.random(1, this.currentDate.daysInMonth()), this.currentDate.daysInMonth()), _.random(1, 5));
      this.dailyExpenseSum = new Big(0);

      this.standartAccounts = _.shuffle(this.standartAccounts);

      this.transferAccounts = {
        from: this.standartAccounts[0]._id,
        to: this.standartAccounts[1]._id,
      };

      for (let currentDay = 1; currentDay <= this.currentDate.daysInMonth(); currentDay++) {
        this.addIncomeOperations(currentDay);
        this.addDailyExpenseOperation();

        this.currentDate.startOf('day');
        this.currentDate.add(1, 'day');
      }

      this.addPayDebtOperation();

      this.sumExpense = this.sumExpense.plus(this.dailyExpenseSum);

      this.currentDate.startOf('month');
      this.currentDate.add(1, 'month');
    }

    this.insertOperations();

    this.totalUpdates = 0;
    this.totalRemoves = 0;
    this.totalTransferUpdates = 0;
    this.totalTransferRemoves = 0;

    this.updateOperations();
    this.removeOperations();
    this.transferOperationsUpdate();
    this.transferOperationsRemove();

    this.printReport();

    return this.userId;
  }

  addCreditAccount() {
    Logstar.info('Create additional accounts');

    this.debtAccountId = Random.id();
    this.debtAmount = _.random(parseFloat(new Big(this.demoAccountYears).times(5000).toFixed(this.currency.decimalDigits)), parseFloat(new Big(this.demoAccountYears).times(80000)));
    this.debtMonthlyPay = parseFloat(new Big(this.debtAmount).div(new Big(this.demoAccountYears).times(12)).toFixed(this.currency.decimalDigits));

    Meteor.call('UsersAccounts/Add', this.userId, {
      name: 'Credit',
      currencyId: this.currency._id,
      startBalance: parseFloat(new Big(this.debtAmount).times(-1).toFixed(this.currency.decimalDigits)),
      type: 'debt',
      _id: this.debtAccountId,
    });
  }

  getRandomCategoryId(type) {
    const categoriesForType = _.filter(this.flatCategories, category => {
      return category.type === type;
    });

    return _.sample(categoriesForType)._id;
  }

  mutateOperationBalance(type, amount) {
    if (type === 'income') {
      return _.random(amount, parseFloat(new Big(amount).plus(_.random(1, amount)).valueOf()));
    }

    return _.random(amount, parseFloat(new Big(amount).minus(_.random(1, amount)).valueOf()));
  }

  mutateCurrentDayTime(day) {
    return day
      .add(_.random(1, 23), 'hour')
      .add(_.random(1, 59), 'minute')
      .add(_.random(1, 59), 'second')
      .toDate();
  }

  getRandomDate() {
    return moment.utc()
      .subtract(this.demoAccountYears, 'year')
      .add(_.random(1, this.demoAccountYears * 365), 'days')
      .add(_.random(1, 23), 'hour')
      .add(_.random(1, 59), 'minute')
      .add(_.random(1, 59), 'second')
      .toDate();
  }

  addIncomeOperations(currentDay) {
    if (currentDay === this.incomeDay1) {
      Meteor.call('UsersOperations/Add', this.userId, _.sample(this.standartAccounts)._id, {
        type: 'income',
        amount: this.incomeDay1Amount,
        date: this.mutateCurrentDayTime(this.currentDate),
        categoryId: this.getRandomCategoryId('income'),
      });

      this.sumIncome = this.sumIncome.plus(this.incomeDay1Amount);
    }

    if (currentDay === this.incomeDay2) {
      Meteor.call('UsersOperations/Add', this.userId, _.sample(this.standartAccounts)._id, {
        type: 'income',
        amount: this.incomeDay2Amount,
        date: this.mutateCurrentDayTime(this.currentDate),
        categoryId: this.getRandomCategoryId('income'),
      });

      this.sumIncome = this.sumIncome.plus(this.incomeDay1Amount);
    }
  }

  addDailyExpenseOperation() {
    const dailyExpense = _.random(1000, parseFloat(new Big(this.incomeDay1Amount).plus(this.incomeDay2Amount).valueOf()));
    const dailyExpenseCount = _.random(1, 10);

    if (this.sumExpense.plus(this.debtMonthlyPay).lt(new Big(this.incomeDay1Amount).plus(this.incomeDay2Amount))) {
      const expenseAccount = G.UsersAccountsCollection
        .findOne({ userId: this.userId })
        .getAccountByMaxBalance();

      if (new Big(expenseAccount.currentBalance).minus(dailyExpense).gte(0)) {
        for (let i = 0; i < dailyExpenseCount; i++) {
          const expenseAmount = parseFloat(new Big(dailyExpense).div(dailyExpenseCount).toFixed(this.currency.decimalDigits));

          this.dailyExpenseSum = this.dailyExpenseSum.plus(expenseAmount);

          Meteor.call('UsersOperations/Add', this.userId, expenseAccount._id, {
            type: 'expense',
            amount: parseFloat(new Big(expenseAmount).times(-1).toFixed(this.currency.decimalDigits)),
            date: this.mutateCurrentDayTime(this.currentDate),
            categoryId: this.getRandomCategoryId('expense'),
          });
        }
      } else {
        this.hungryDays = this.hungryDays.plus(1);
      }
    }
  }

  addTransferOperation(currentDay) {
    if (this.transferDays.indexOf(currentDay) >= 0) {
      const fromAccountBalance = G.UsersAccountsCollection
        .findOne({ userId: userId })
        .getAccount(this.transferAccounts.from)
        .currentBalance;

      if (fromAccountBalance >= 1) {
        const transferAmount = _.random(1, fromAccountBalance);

        sumTransfer = sumTransfer.plus(transferAmount);

        Meteor.call('UsersOperations/AddTransfer', this.userId, this.transferAccounts.from, this.transferAccounts.to, {
          amount: this.transferAmount,
          date: mutateCurrentDayTime(currentDate),
        });
      }
    }
  }

  addPayDebtOperation() {
    const payDebtAccount =  G.UsersAccountsCollection
      .findOne({ userId: this.userId })
      .getAccountByMaxBalance();

    const debtAccountBalance = G.UsersAccountsCollection
      .findOne({ userId: this.userId })
      .getAccount(this.debtAccountId).currentBalance;

    if (new Big(debtAccountBalance).lt(0) && new Big(payDebtAccount.currentBalance).gt(0)) {
      let payDebtAmount = new Big(payDebtAccount.currentBalance).gt(this.debtMonthlyPay) ? payDebtAccount.currentBalance : this.debtMonthlyPay;
      payDebtAmount = new Big(debtAccountBalance).times(-1).lt(payDebtAmount) ? parseFloat(new Big(debtAccountBalance).valueOf()) : payDebtAmount;

      this.sumDebt = this.sumDebt.plus(payDebtAmount);

      Meteor.call('UsersOperations/AddTransfer', this.userId, payDebtAccount._id, this.debtAccountId, {
        amount: payDebtAmount,
        date: this.currentDate.toDate(),
      });
    }
  }

  insertOperations() {
    const insertOperationsCount = _.random(10, 20);

    for (let i = 0; i < insertOperationsCount; i++) {
      const account =  _.sample(G.UsersAccountsCollection.findOne({ userId: this.userId }).getAccountsByType('standart'))._id;
      const type = _.sample(['income', 'expense']);
      const amount = _.random(100, 3000);

      Meteor.call('UsersOperations/Add', this.userId, account, {
        type,
        amount: type === 'expense' ? -(amount) : amount,
        date: this.getRandomDate(),
        categoryId: this.getRandomCategoryId(type),
      });

      if (type === 'income') {
        this.sumIncome = this.sumIncome.plus(amount);
      } else {
        this.sumExpense = this.sumExpense.plus(amount);
      }
    }
  }

  getOperationsToUpdate(transfer = false) {
    return G.UsersOperationsCollection
      .find({ dayBalance: { $exists: false }, groupTo: { $exists: transfer } })
      .fetch();
  }

  updateOperations() {
    let operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      Meteor.call('UsersOperations/Update', this.userId, operation._id, {
        date: this.getRandomDate(),
      });

      this.totalUpdates++;
    }.bind(this));

    operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      const newAmount = this.mutateOperationBalance(operation.type, operation.amount);

      Meteor.call('UsersOperations/Update', this.userId, operation._id, {
        amount: newAmount,
      });

      if (operation.type === 'expense') {
        this.sumExpense = this.sumExpense.minus(new Big(newAmount).minus(operation.amount));
      } else {
        this.sumIncome = this.sumIncome.plus(new Big(newAmount).minus(operation.amount));
      }

      this.totalUpdates++;
    }.bind(this));

    operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      Meteor.call('UsersOperations/Update', this.userId, operation._id, {
        categoryId: this.getRandomCategoryId(operation.type),
      });

      this.totalUpdates++;
    }.bind(this));

    operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      const accountIds = G.UsersAccountsCollection
        .findOne({ userId: this.userId })
        .getAccountsByType('standart')
        .map(account => account._id);

      const accountToMove = _.difference(accountIds, [operation.accountId])[0];

      Meteor.call('UsersOperations/Update', this.userId, operation._id, {
        accountId: accountToMove,
      });

      this.totalUpdates++;
    }.bind(this));

    operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      const newAmount =  this.mutateOperationBalance(operation.type, operation.amount);

      const accountIds = G.UsersAccountsCollection
        .findOne({ userId: this.userId })
        .getAccountsByType('standart')
        .map(account => account._id);

      const accountToMove = _.difference(accountIds, [operation.accountId])[0];

      Meteor.call('UsersOperations/Update', this.userId, operation._id, {
        date: this.getRandomDate(),
        accountId: accountToMove,
        amount: newAmount,
        categoryId: this.getRandomCategoryId(operation.type),
      });

      if (operation.type === 'expense') {
        this.sumExpense = this.sumExpense.minus(new Big(newAmount).minus(operation.amount));
      } else {
        this.sumIncome = this.sumIncome.plus(new Big(newAmount).minus(operation.amount));
      }

      this.totalUpdates++;
    }.bind(this));
  }

  removeOperations() {
    operationsToUpdate = _.sample(this.getOperationsToUpdate(), _.random(10, 20));

    operationsToUpdate.forEach(operation => {
      Meteor.call('UsersOperations/Remove', this.userId, operation._id);

      if (operation.type === 'expense') {
        this.sumExpense.plus(operation.amount);
      } else {
        this.sumIncome.minus(operation.amount);
      }

      this.totalRemoves++;
    }.bind(this));
  }

  transferOperationsUpdate() {
    operationsToUpdate = _.sample(this.getOperationsToUpdate(true), _.random(10, 20))
      .filter(operation => operation.type === 'expense');

    operationsToUpdate.forEach(operation => {
      const newAmount =  this.mutateOperationBalance(operation.type, operation.amount);

      const accountIds = G.UsersAccountsCollection
        .findOne({ userId: this.userId })
        .getAccountsByType('standart')
        .map(account => account._id);

      const accountToMove = _.difference(accountIds, [operation.accountId])[0];

      Meteor.call('UsersOperations/UpdateTransfer', this.userId, operation._id, {
        date: this.getRandomDate(),
        accountId: accountToMove,
        amount: newAmount,
      });

      this.totalTransferUpdates++;
    }.bind(this));
  }

  transferOperationsRemove() {
    operationsToUpdate = _.uniq(_.sample(this.getOperationsToUpdate(true), _.random(10, 20)).filter(operation => operation.type === 'expense'));

    operationsToUpdate.forEach(operation => {
      Meteor.call('UsersOperations/Remove', this.userId, operation._id);

      this.totalTransferRemoves++;
    }.bind(this));
  }

  printReport() {
    this.sumIncome = parseFloat(this.sumIncome.toFixed(this.currency.decimalDigits));
    this.sumExpense = parseFloat(this.sumExpense.toFixed(this.currency.decimalDigits));
    this.sumTransfer = parseFloat(this.sumTransfer.toFixed(this.currency.decimalDigits));
    this.sumDebt = parseFloat(this.sumDebt.toFixed(this.currency.decimalDigits));

    const totalCheck = parseFloat(new Big(this.sumIncome).minus(this.sumExpense).minus(this.sumDebt).minus(Meteor.call('UsersAccounts/GetSimpleTotal', this.userId)).valueOf());

    Logstar.info(`--- Generated user stats ---`);
    Logstar.info(`Total income ${this.sumIncome}`);
    Logstar.info(`Total expense ${this.sumExpense}`);
    Logstar.info(`Total transfer ${this.sumTransfer}`);
    //Logstar.info(`Debt paid ${this.sumDebt} of ${this.debtAmount}, left ${debtAmount - sumDebt}`);
    //Logstar.info(`Hungry days ${hungryDays}`);
    Logstar.info(`Total updates ${this.totalUpdates}`);
    Logstar.info(`Total removes ${this.totalRemoves}`);
    Logstar.info(`Total transfer updates ${this.totalTransferUpdates}`);
    Logstar.info(`Total transfer removes ${this.totalTransferRemoves}`);
    Logstar.info(`User test status ${totalCheck === 0 ? 'OK' : 'FAIL'} (${totalCheck})`);
    Logstar.info(`--- Generated user stats ---`);
    //Logstar.info(`User generation end for ${email}`);
  }
}

G.generateUser = (email, password, profile, years = 3) => {
  return new UserGenerator(email, password, profile, years);
};
