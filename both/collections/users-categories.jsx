G.UsersCategoriesCollection = new Meteor.Collection('usersCategories');

// Helpers
const flattenCategories = (categories, flat = []) => {
  let nextFlat = flat;

  categories.forEach(category => {
    if (category.children) {
      nextFlat = flattenCategories(category.children, nextFlat);
    }

    nextFlat.push(_.omit(category, 'children'));
  });

  return nextFlat;
};

G.UsersCategoriesCollection.helpers({
  getFlatCategories: function getFlatCategories() {
    return flattenCategories(this.categories);
  },
  getCategory: function getCategory(categoryid) {
    return _.find(flattenCategories(this.categories), category => {
      return category._id === categoryid;
    });
  },
});
