G.UsersOperationsCollection = new Meteor.Collection('usersOperations');

const getLastBalance = (userId, accountId, fromDate) => {
  const lastOperation = G.UsersOperationsCollection.findOne({
    date: {
      $lt: fromDate,
    },
    userId,
    accountId,
    dayBalance: {
      $exists: false,
    },
    balance: {
      $exists: true,
    },
  }, {
    sort: {
      date: -1,
    },
  });

  let lastOperationBalance;

  if (lastOperation) {
    lastOperationBalance = lastOperation.balance;
  } else {
    lastOperationBalance = G.UsersAccountsCollection
      .findOne({ userId })
      .getAccount(accountId)
      .startBalance;
  }

  return lastOperationBalance;
};

const balanceCorrection = (userId, accountId, fromDate) => {
  let currentBalance = getLastBalance(userId, accountId, fromDate);

  G.UsersOperationsCollection.find({
    date: {
      $gte: fromDate,
    },
    accountId,
    userId,
  }, {
    sort: {
      date: 1,
      dayBalance: -1,
    },
  }).forEach((nextOperation) => {
    if (nextOperation.amount) {
      currentBalance += nextOperation.amount;
    }

    G.UsersOperationsCollection.direct.update(nextOperation._id, {
      $set: {
        [_.isUndefined(nextOperation.dayBalance) ? 'balance' : 'dayBalance']: currentBalance,
      },
    });
  });

  G.UsersAccountsCollection.update({
    userId,
    'accounts._id': accountId,
  }, {
    $set: {
      'accounts.$.currentBalance': currentBalance,
    },
  });
};

const upsertDayBalance = (userId, accountId, date, balance) => {
  const countDayBalanceOperations = G.UsersOperationsCollection.find({
    userId,
    accountId,
    dayBalance: {
      $exists: true,
    },
    balance: {
      $exists: false,
    },
    date: {
      $gte: moment.utc(date).startOf('day').toDate(),
      $lte: moment.utc(date).endOf('day').toDate(),
    },
  }).count();

  if (countDayBalanceOperations > 0) {
    return;
  }

  G.UsersOperationsCollection.direct.insert({
    userId,
    accountId,
    date: moment.utc(date).startOf('day').toDate(),
    dayBalance: balance,
  });
};

const dayBalanceCorrenction = (userId, accountId, date) => {
  const countDayOperations = G.UsersOperationsCollection.find({
    userId,
    accountId,
    dayBalance: {
      $exists: false,
    },
    balance: {
      $exists: true,
    },
    date: {
      $gte: moment.utc(date).startOf('day').toDate(),
      $lte: moment.utc(date).endOf('day').toDate(),
    },
  }).count();

  if (countDayOperations === 0) {
    G.UsersOperationsCollection.direct.remove({
      userId,
      accountId,
      dayBalance: {
        $exists: true,
      },
      balance: {
        $exists: false,
      },
      date: {
        $gte: moment.utc(date).startOf('day').toDate(),
        $lte: moment.utc(date).endOf('day').toDate(),
      },
    });
  } else {
    upsertDayBalance(userId, accountId, date, getLastBalance(userId, accountId, date));
  }
};

// Hooks
G.UsersOperationsCollection.before.insert((userId, operation) => {
  const currentBalance = G.UsersAccountsCollection.findOne({ userId: operation.userId }).getAccount(operation.accountId).currentBalance;

  operation.balance = operation.amount + currentBalance;
  operation.date = moment.utc(operation.date).toDate();

  upsertDayBalance(operation.userId, operation.accountId, operation.date, currentBalance);
});

G.UsersOperationsCollection.after.insert((userId, operation) => {
  if (!operation.amount) {
    return;
  }

  const operationsAfter = G.UsersOperationsCollection.find({
    date: {
      $gt: operation.date,
    },
    accountId: operation.accountId,
    userId: operation.userId,
    balance: {
      $exists: true,
    },
    dayBalance: {
      $exists: false,
    },
  }).count();

  if (operationsAfter > 0) {
    balanceCorrection(operation.userId, operation.accountId, operation.date);
  } else {
    Meteor.call('UsersAccounts/UpdateBalance', operation.userId, operation.accountId, operation.amount);
  }
});

G.UsersOperationsCollection.after.update(function afterUpdate(userId, operation) {
  if (operation.amount === this.previous.amount && operation.date === this.previous.date && operation.accountId === this.previous.accountId) {
    return;
  }

  const fromDate = this.previous.date < operation.date ? this.previous.date : operation.date;

  balanceCorrection(operation.userId, operation.accountId, fromDate);

  if (operation.date !== this.previous.date) {
    dayBalanceCorrenction(operation.userId, operation.accountId, operation.date);
  }

  if (operation.accountId !== this.previous.accountId) {
    balanceCorrection(operation.userId, this.previous.accountId, fromDate);

    if (operation.date !== this.previous.date) {
      dayBalanceCorrenction(operation.userId, this.previous.accountId, this.previous.date);
    }
  }
});

G.UsersOperationsCollection.after.remove(function afterRemove(userId, operation) {
  dayBalanceCorrenction(operation.userId, operation.accountId, operation.date);
  balanceCorrection(operation.userId, operation.accountId, operation.date);
});
