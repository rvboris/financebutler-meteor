'use strict';

Meteor.methods({
  addUserOperation: (userId, accountId, operation) => {
    operation.date = operation.date || new Date();

    let user = Meteor.users.findOne(userId);

    if (!user) {
      throw new Meteor.Error('user is not finded');
    }

    let account = G.UsersAccountsCollection.findOne({userId}).getAccount(accountId);

    if (!account) {
      throw new Meteor.Error('account is not finded');
    }

    if (operation.categoryId) {
      let category = G.UsersCategoriesCollection.findOne({userId}).getCategory(operation.categoryId);

      if (!category) {
        throw new Meteor.Error('category is not finded');
      }
    }

    if (!operation.type) {
      throw new Meteor.Error('operation type is required');
    }

    if (['expense', 'income'].indexOf(operation.type) < 0) {
      throw new Meteor.Error('invalid operation type');
    }

    if (!operation.amount) {
      throw new Meteor.Error('operation amount is required');
    }

    operation.amount = _.round(_.parseInt(operation.amount));

    if (operation.amount === 0) {
      throw new Meteor.Error('operation amount can not be equal 0');
    }

    if (operation.type === 'expense' && operation.amount > 0) {
      throw new Meteor.Error('expense operation must be negative');
    }

    if (operation.type === 'income' && operation.amount < 0) {
      throw new Meteor.Error('income operation must be positive');
    }

    let operationToInsert = {
      userId: userId,
      accountId: accountId,
      type: operation.type,
      date: operation.date,
      amount: operation.amount
    };

    if (operation.categoryId) {
      operationToInsert.categoryId = operation.categoryId;
    }

    return G.UsersOperationsCollection.insert(operationToInsert);
  },

  addTransferUserOperation: (userId, accountIdFrom, accountIdTo, operation) => {
    operation.date = operation.date || new Date();

    if (!operation.amount) {
      throw new Meteor.Error('operation amount is required');
    }

    operation.amount = _.round(_.parseInt(operation.amount));

    if (operation.amount === 0) {
      throw new Meteor.Error('operation amount can not be equal 0');
    }

    let groupFromOperation = Meteor.call('addUserOperation', userId, accountIdFrom, {
      amount: operation.amount > 0 ? operation.amount * -1 : operation.amount,
      date: operation.date,
      type: 'expense'
    });

    let groupToOperation = Meteor.call('addUserOperation', userId, accountIdTo, {
      amount: operation.amount < 0 ? operation.amount * -1 : operation.amount,
      date: operation.date,
      type: 'income'
    });

    G.UsersOperationsCollection.direct.update(groupFromOperation, { $set: { groupTo: groupToOperation } });
    G.UsersOperationsCollection.direct.update(groupToOperation, { $set: { groupTo: groupFromOperation } });
  },

  updateUserOperation: (userId, operationId, operation) => {
    let fieldsToUpdate = {};

    if (operation.amount) {
      operation.amount = _.round(_.parseInt(operation.amount));

      if (operation.amount === 0) {
        throw new Meteor.Error('operation amount can not be equal 0');
      }

      fieldsToUpdate['amount'] = operation.amount;
    }

    if (operation.categoryId) {
      let category = G.UsersCategoriesCollection.findOne({userId}).getCategory(operation.categoryId);

      if (!category) {
        throw new Meteor.Error('category is not finded');
      }

      fieldsToUpdate['categoryId'] = operation.categoryId;
    }

    if (operation.accountId) {
      let account = G.UsersAccountsCollection.findOne({userId}).getAccount(operation.accountId);

      if (!account) {
        throw new Meteor.Error('account is not finded');
      }

      fieldsToUpdate['accountId'] = operation.accountId;
    }

    if (operation.date) {
      fieldsToUpdate['date'] = operation.date;
    }

    return G.UsersOperationsCollection.update({ userId, _id: operationId }, { $set: fieldsToUpdate });
  },

  updateTransferUserOperation: (userId, operationId, operation) => {
    let operationInfo =  G.UsersOperationsCollection.findOne(operationId);

    if ((operationInfo.type === 'expense' && operation.amount > 0) || (operationInfo.type === 'income' && operation.amount < 0)) {
      operation.amount = operation.amount * -1;
    }

    Meteor.call('updateUserOperation', userId, operationId, operation);
    Meteor.call('updateUserOperation', userId, operationInfo.groupTo, operation);
  },

  removeUserOperation: (userId, operationId, removeAccount = false) => {
    let operationToRemove = G.UsersOperationsCollection.findOne(operationId);

    if (!operationToRemove) {
      throw new Meteor.Error('operation is not finded');
    }

    if (removeAccount) {
      G.UsersOperationsCollection.direct.remove(operationId);
    } else {
      G.UsersOperationsCollection.remove(operationId);
    }

    if (operationToRemove.groupTo) {
      G.UsersOperationsCollection.remove(operationToRemove.groupTo);
    }
  }
});
