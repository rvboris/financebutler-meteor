const namespace = 'UsersAccounts';

Meteor.methods({
  [`${namespace}/Add`]: (userId, account) => {
    account._id = account._id || Random.id();
    account.startBalance = account.startBalance || 0;
    account.currentBalance = account.startBalance;
    account.order = account.order || 0;
    account.status = account.status || 'active';
    account.createdAt = account.createdAt || new Date();
    account.createdAt = moment.utc(account.createdAt).toDate();

    const user = Meteor.users.findOne(userId);

    if (!user) {
      throw new Meteor.Error('ERROR.USER_NOT_FOUND', 'User is not found');
    }

    const userAccounts = G.UsersAccountsCollection.findOne({userId}).accounts;

    if (['debt', 'standart'].indexOf(account.type) < 0) {
      throw new Meteor.Error('ERROR.INVALID_ACCOUNT_TYPE', 'Invalid account type');
    }

    if (['active', 'closed'].indexOf(account.status) < 0) {
      throw new Meteor.Error('ERROR.INVALID_ACCOUNT_STATUS', 'Invalid account status');
    }

    if (account.type === 'debt' && new Big(account.startBalance).gte(0)) {
      throw new Meteor.Error('ERROR.ACCOUNT_ONLY_NEGATIVE', 'Debt account can only have a negative balance');
    } else if (account.type === 'standart' && new Big(account.startBalance).lt(0)) {
      throw new Meteor.Error('ERROR.ACCOUNT_ONLY_POSITIVE', 'Standart account can only have a positive balance');
    }

    if (!account.name) {
      throw new Meteor.Error('ERROR.ACCOUNT_NAME_EMPTY', 'Account name is empty');
    }

    const nameExists = userAccounts.find(acc => acc.name === account.name);

    if (nameExists) {
      throw new Meteor.Error('ERROR.ACCOUNT_NAME_EXISTS', 'Account with the same name already exists');
    }

    if (!account.currencyId) {
      throw new Meteor.Error('ERROR.ACCOUNT_CURRENCY_EMPTY', 'Account currency is empty');
    }

    const currency = G.CurrenciesCollection.findOne(account.currencyId);

    if (!currency) {
      throw new Meteor.Error('ERROR.CURRENCY_NOT_FOUND', 'Currency is not found');
    }

    G.UsersAccountsCollection.update({
      userId: userId,
    }, {
      $addToSet: {
        accounts: account,
      },
    });

    return account._id;
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
    const newBalance = parseFloat(new Big(account.currentBalance).plus(balance).toFixed(currency.decimalDigits));

    return G.UsersAccountsCollection.update({
      userId: userId,
      'accounts._id': accountId,
    }, {
      $set: {
        'accounts.$.currentBalance': newBalance,
      },
    });
  },

  [`${namespace}/GetSimpleTotal`]: (userId, debt = true) => {
    return _.sum(G.UsersAccountsCollection.findOne({userId}).accounts, account => {
      return account.type === 'debt' && !debt ? 0 : account.currentBalance;
    });
  },

  [`${namespace}/GetBalanceInCurrency`]: (userId, accountId) => {
    const userCurrency = Meteor.users.findOne(userId).getCurrency();
    const account = G.UsersAccountsCollection.findOne({ userId }).getAccount(accountId);
    const accountCurrency = G.CurrenciesCollection.findOne(account.currencyId);

    if (userCurrency._id !== accountCurrency._id) {
      return fx(account.currentBalance).from(accountCurrency.code).to(userCurrency.code);
    }

    return account.currentBalance;
  },

  [`${namespace}/GetCurrencyTotal`]: (userId, debt = true) => {
    let total = new Big(0);

    G.UsersAccountsCollection.findOne({userId}).accounts.forEach(account => {
      if (account.type === 'debt' && !debt) {
        return;
      }

      total = total.plus(Meteor.call(`${namespace}/GetBalanceInCurrency`, userId, account._id));
    });

    return parseFloat(total.valueOf());
  },
});
