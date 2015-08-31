'use strict';

G.UsersOperationsCollection = new Meteor.Collection('usersOperations');

let getLastBalance = (operation, accountId, fromDate) => {
  let lastOperation = G.UsersOperationsCollection.findOne({
    date: {
      $lt: fromDate || operation.date
    },
    userId: operation.userId,
    accountId: accountId,
    dayBalance: {
      $exists: false
    },
    balance: {
      $exists: true
    }
  }, {
    sort: {
      date: -1
    }
  });

  let lastOperationBalance;

  if (lastOperation) {
    lastOperationBalance = lastOperation.balance;
  } else {
    lastOperationBalance = G.UsersAccountsCollection
      .findOne({ userId: operation.userId })
      .getAccount(accountId)
      .startBalance;
  }

  return lastOperationBalance;
}

let balanceCorrection = (operation, accountId, fromDate) => {
  let currentBalance = getLastBalance(operation, accountId, fromDate);

  G.UsersOperationsCollection.find({
    date: {
      $gte: fromDate || operation.date
    },
    accountId: accountId,
    userId: operation.userId
  },
  {
    sort: {
      date: 1
    }
  }).forEach((nextOperation) => {
    if (nextOperation.amount) {
      currentBalance += nextOperation.amount;
    }

    G.UsersOperationsCollection.direct.update(nextOperation._id, { $set: { [nextOperation.dayBalance ? 'dayBalance' : 'balance']: currentBalance } });
  });

  G.UsersAccountsCollection.update({
    userId: operation.userId,
    'accounts._id': accountId
  }, {
    $set: {
      'accounts.$.currentBalance': currentBalance
    }
  });
};

// Hooks
G.UsersOperationsCollection.before.insert((userId, operation) => {
  let currentBalance = G.UsersAccountsCollection.findOne({ userId: operation.userId }).getAccount(operation.accountId).currentBalance;

  operation.balance = operation.amount + currentBalance;

  let dayBalanceCount = G.UsersOperationsCollection.find({
     userId: operation.userId,
     accountId: operation.accountId,
     dayBalance: {
       $exists: true
     },
     date: {
       $gte: moment(operation.date).startOf('day').toDate(),
       $lte: moment(operation.date).endOf('day').toDate(),
     }
   }).count();

  if (dayBalanceCount === -1) {
    G.UsersOperationsCollection.direct.insert({
      date: operation.date,
      userId: operation.userId,
      dayBalance: currentBalance,
      accountId: operation.accountId
    });
  }
});

G.UsersOperationsCollection.after.insert((userId, operation) => {
  if (!operation.amount) {
    return;
  }

  let operationsAfter = G.UsersOperationsCollection.find({
    date: { $gt: operation.date },
    accountId: operation.accountId,
    userId: operation.userId,
    balance: { $exists: true }
  }).count();

  if (operationsAfter > 0) {
    balanceCorrection(operation, operation.accountId);
  } else {
    Meteor.call('updateUserAccountBalance', operation.userId, operation.accountId, operation.amount);
  }
});

G.UsersOperationsCollection.after.update(function (userId, operation) {
  if (operation.amount === this.previous.amount && operation.date === this.previous.date && operation.accountId === this.previous.accountId) {
    return;
  }

  let fromDate = this.previous.date < operation.date ? this.previous.date : operation.date;

  balanceCorrection(operation, operation.accountId, fromDate);

  if (operation.accountId !== this.previous.accountId) {
    balanceCorrection(operation, this.previous.accountId, fromDate);
  }
});

G.UsersOperationsCollection.after.remove(function (userId, operation) {
  let countDayOperations = G.UsersOperationsCollection.find({
    date: {
      $gte: moment(operation.date).startOf('day').toDate(),
      $lte: moment(operation.date).endOf('day').toDate()
    }
  }).count();

  if (countDayOperations === 0) {
    G.UsersOperationsCollection.direct.remove({
      dayBalance: {
        $exists: true
      },
      date: {
        $gte: moment(operation.date).startOf('day').toDate(),
        $lte: moment(operation.date).endOf('day').toDate()
      }
    });
  }

  balanceCorrection(operation, operation.accountId);
});
