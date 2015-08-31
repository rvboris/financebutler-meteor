'use strict';

G.UsersAccountsCollection = new Meteor.Collection('usersAccounts');

// Helpers
G.UsersAccountsCollection.helpers({
  getAccount: function(accountId) {
    return _.find(this.accounts, account => {
      return account._id === accountId;
    });
  },
  getAccountsByType: function(type) {
    return _.filter(this.accounts, account => {
      return account.type === type;
    });
  },
  getAccountByMaxBalance: function() {
    return _.max(this.accounts, 'currentBalance');
  }
});

// Hooks
G.UsersAccountsCollection.after.update(function (userId, account) {
  if (account.accounts.length < this.previous.accounts.length) {
    let removedAccounts = _.difference(this.previous.accounts.map(acc => acc._id), account.accounts.map(acc => acc._id));

    removedAccounts.forEach(removedAccount => {
      G.UsersOperationsCollection.find({ userId: account.userId, accountId: removedAccount }).forEach(operation => {
        Meteor.call('removeUserOperation', operation.userId, operation._id, true);
      });
    });
  }
});
