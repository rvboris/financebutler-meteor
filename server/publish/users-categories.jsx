Meteor.publish('usersCategories', function usersCategories() {
  return G.UsersCategoriesCollection.find({ userId: this.userId });
});
