Security.defineMethod('isCurrentUser', {
  fetch: [],
  transform: null,
  deny: (type, arg, userId, doc) => {
    return userId !== (doc.userId ? doc.userId : doc._id);
  },
});

Meteor.users.permit(['update']).isCurrentUser().apply();
