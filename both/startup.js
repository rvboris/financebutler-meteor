Meteor.startup(() => {
  T9n.setLanguage(Meteor.settings.public.language);
});
