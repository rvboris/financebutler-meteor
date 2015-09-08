window.exports = window.exports || {}; // eslint-disable-line

Meteor.startup(() => {
  Session.set('translateReady', false);

  TAPi18n.setLanguage(Meteor.settings.public.language)
    .done(() => Session.set('translateReady', true));
});
