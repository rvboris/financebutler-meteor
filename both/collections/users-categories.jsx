'use strict';

G.UsersCategoriesCollection = new Meteor.Collection('usersCategories');

// Helpers

let flattenCategories = (categories, flat = []) => {
  categories.forEach(category => {
    if (category.children) {
      flat = flattenCategories(category.children, flat);
    }

    flat.push(_.omit(category, 'children'));
  });

  return flat;
};

G.UsersCategoriesCollection.helpers({
  getFlatCategories: function() {
    return flattenCategories(this.categories);
  },

  getCategory: function (categoryid) {
    return _.find(flattenCategories(this.categories), category => {
      return category._id === categoryid;
    });
  }
});
