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
    const removedAccounts = _.difference(this.previous.accounts.map(acc => acc._id), account.accounts.map(acc => acc._id));

    removedAccounts.forEach(removedAccount => {
      G.UsersOperationsCollection.find({ userId: account.userId, accountId: removedAccount }).forEach(operation => {
        Meteor.call('UsersOperations/Remove', operation.userId, operation._id, true);
      });
    });
  }
});
