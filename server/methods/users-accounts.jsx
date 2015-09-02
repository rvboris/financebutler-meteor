const namespace = 'UsersAccounts';

Meteor.methods({
  [`${namespace}/Add`]: (userId, account) => {
    account._id = account._id || Random.id();
    account.startBalance = account.startBalance || 0;
    account.currentBalance = account.startBalance;
    account.order = account.order || 0;
    account.status = account.status || 'active';

    const user = Meteor.users.findOne(userId);

    if (!user) {
      throw new Meteor.Error('user is not finded');
    }

    if (['debt', 'standart'].indexOf(account.type) < 0) {
      throw new Meteor.Error('invalid account type');
    }

    if (['active', 'closed'].indexOf(account.status) < 0) {
      throw new Meteor.Error('invalid account status');
    }

    if (account.type === 'debt' && account.startBalance >= 0) {
      throw new Meteor.Error('debt account may be only negative balance');
    }

    if (!account.name) {
      throw new Meteor.Error('account name is empty');
    }

    if (!account.currencyId) {
      throw new Meteor.Error('account currencyId is empty');
    }

    const currency = G.CurrenciesCollection.findOne(account.currencyId);

    if (!currency) {
      throw new Meteor.Error('currency is not finded');
    }

    return G.UsersAccountsCollection.update({
      userId: userId,
    }, {
      $addToSet: {
        accounts: account,
      },
    });
  },

  [`${namespace}/Remove`]: (userId, accountId) => {
    return G.UsersAccountsCollection.update({
      userId: userId,
    }, {
      $pull: {
        accounts: {
          _id: accountId,
        },
      },
    });
  },

  [`${namespace}/Update`]: (userId, accountId, account) => {
    const fieldsToUpdate = {};

    if (account.name) {
      fieldsToUpdate['accounts.$.name'] = account.name;
    }

    if (account.startBalance) {
      fieldsToUpdate['accounts.$.startBalance'] = account.startBalance;
    }

    if (account.order) {
      fieldsToUpdate['accounts.$.order'] = account.order;
    }

    if (account.status) {
      if (['active', 'closed'].indexOf(account.status) < 0) {
        throw new Meteor.Error('invalid account status');
      }

      fieldsToUpdate['accounts.$.status'] = account.status;
    }

    return G.UsersAccountsCollection.update({
      userId: userId,
      'accounts._id': accountId,
    }, {
      $set: fieldsToUpdate,
    });
  },

  [`${namespace}/UpdateBalance`]: (userId, accountId, balance) => {
    return G.UsersAccountsCollection.update({
      userId: userId,
      'accounts._id': accountId,
    }, {
      $inc: {
        'accounts.$.currentBalance': balance,
      },
    });
  },

  [`${namespace}/GetTotals`]: userId => {
    return _.sum(G.UsersAccountsCollection.findOne({userId}).accounts, account => {
      return account.currentBalance;
    });
  },
});
