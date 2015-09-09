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
      throw new Meteor.Error('ERROR.USER_NOT_FOUND', 'User is not found');
    }

    if (['debt', 'standart'].indexOf(account.type) < 0) {
      throw new Meteor.Error('ERROR.INVALID_ACCOUNT_TYPE', 'Invalid account type');
    }

    if (['active', 'closed'].indexOf(account.status) < 0) {
      throw new Meteor.Error('ERROR.INVALID_ACCOUNT_STATUS', 'Invalid account status');
    }

    if (account.type === 'debt' && account.startBalance >= 0) {
      throw new Meteor.Error('ERROR.ACCOUNT_ONLY_NEGATIVE', 'Debt account can only have a negative balance');
    }

    if (!account.name) {
      throw new Meteor.Error('ERROR.ACCOUNT_NAME_EMPTY', 'Account name is empty');
    }

    if (!account.currencyId) {
      throw new Meteor.Error('ERROR.ACCOUNT_CURRENCY_EMPTY', 'Account currency is empty');
    }

    const currency = G.CurrenciesCollection.findOne(account.currencyId);

    if (!currency) {
      throw new Meteor.Error('ERROR.CURRENCY_NOT_FOUND', 'Currency is not found');
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
        throw new Meteor.Error('ERROR.INVALID_ACCOUNT_STATUS', 'Invalid account status');
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
    const account = G.UsersAccountsCollection.findOne({userId}).getAccount(accountId);
    const currency = G.CurrenciesCollection.findOne(account.currencyId);

    return G.UsersAccountsCollection.update({
      userId: userId,
      'accounts._id': accountId,
    }, {
      $set: {
        'accounts.$.currentBalance': +(account.currentBalance + balance).toFixed(currency.decimalDigits),
      },
    });
  },

  [`${namespace}/GetSimpleTotal`]: userId => {
    return _.sum(G.UsersAccountsCollection.findOne({userId}).accounts, account => {
      return account.currentBalance;
    });
  },

  [`${namespace}/GetCurrencyTotal`]: userId => {
    const userCurrency = Meteor.users.findOne(userId).getCurrency();

    return _.sum(G.UsersAccountsCollection.findOne({userId}).accounts, account => {
      const accountCurrency = G.CurrenciesCollection.findOne(account.currencyId);

      if (accountCurrency.code === userCurrency.code) {
        return account.currentBalance;
      }

      return fx(account.currentBalance).from(accountCurrency.code).to(userCurrency.code);
    });
  },
});
