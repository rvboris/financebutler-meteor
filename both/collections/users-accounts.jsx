G.UsersAccountsCollection = new Meteor.Collection('usersAccounts');

// Helpers
G.UsersAccountsCollection.helpers({
  getAccount: function getAccount(accountId) {
    return _.find(this.accounts, account => {
      return account._id === accountId;
    });
  },
  getAccountsByType: function getAccountsByType(type) {
    return _.filter(this.accounts, account => {
      return account.type === type;
    });
  },
  getAccountByMaxBalance: function getAccountByMaxBalance() {
    return _.max(this.accounts, 'currentBalance');
  },
  getCurrency: function getAccount(accountId) {
    const account = _.find(this.accounts, account => {
      return account._id === accountId;
    });

    if (!account) {
      return account;
    }

    return G.CurrenciesCollection.findOne(account.currencyId);
  },
});

// Hooks
G.UsersAccountsCollection.after.update(function afterUpdate(userId, account) {
  if (account.accounts.length < this.previous.accounts.length) {
    const removedAccounts = _.select(this.previous.accounts, acc => !_.findWhere(account.accounts, { _id: acc._id }));

    removedAccounts.forEach(removedAccount => {
      G.UsersOperationsCollection.find({ userId: account.userId, accountId: removedAccount._id }).forEach(operation => {
        Meteor.call('UsersOperations/Remove', operation.userId, operation._id, true);
      });
    });

    return;
  }

  const startBalanceChanged = _.select(this.previous.accounts, acc => !_.findWhere(account.accounts, { startBalance: acc.startBalance }));

  startBalanceChanged.forEach(changedAccount => {
    G.balanceCorrection(account.userId, changedAccount._id, changedAccount.createdAt);
  });
});
