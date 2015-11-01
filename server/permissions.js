Security.defineMethod('isCurrentUser', {
  fetch: [],
  transform: null,
  deny: (type, arg, userId, doc) => {
    return userId !== (doc.userId ? doc.userId : doc._id);
  },
});

Meteor.users.permit(['update']).isCurrentUser().apply();

G.UsersAccountsCollection.permit(['update', 'remove']).isCurrentUser().apply();
G.UsersAccountsCollection.permit(['insert']).ifLoggedIn().apply();

G.UsersCategoriesCollection.permit(['update', 'remove']).isCurrentUser().apply();
G.UsersCategoriesCollection.permit(['insert']).ifLoggedIn().apply();

G.UsersOperationsCollection.permit(['update', 'remove']).isCurrentUser().apply();
G.UsersOperationsCollection.permit(['insert']).ifLoggedIn().apply();
