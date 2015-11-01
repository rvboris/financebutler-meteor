Meteor.publish('usersAccounts', function usersAccounts() {
  return G.UsersAccountsCollection.find({ userId: this.userId });
});
