'use strict';

_ = lodash;

Meteor.startup(() => {
  if (Meteor.settings.public.env === 'production') {
    Logstar.isLocal = false;
  } else if (Meteor.settings.public.env === 'development') {
    Package['xolvio:cleaner'].resetDatabase();
  }

  Logstar.allow({
    log: userId => {
      return true;
    }
  });

  Logstar.info('Setup Accounts');

  Accounts.config({
    sendVerificationEmail: true
  });

  Accounts.onCreateUser((options, user) => {
    user.profile = options.profile || {};

    if (user.services) {
      if (user.services.facebook) {
        user.profile.name = user.services.facebook.name;
        user.profile.picture = `http://graph.facebook.com/${user.services.facebook.id}/picture/?type=large`;
      }

      if (user.services.google) {
        user.profile.name = user.services.google.name;
        user.profile.picture = user.services.google.picture;
      }

      if (user.services.twitter) {
        user.profile.name = user.services.twitter.screenName;
        user.profile.picture = user.services.twitter.profile_image_url;
      }
    }

    if (!user.profile.name && user.emails) {
      user.profile.name = user.emails[user.emails.length - 1].address.split('@')[0];
    }

    return user;
  });

  ServiceConfiguration.configurations.remove({
    service: 'facebook'
  });

  ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: Meteor.settings.facebook.appId,
    secret: Meteor.settings.facebook.secret
  });

  ServiceConfiguration.configurations.remove({
    service: 'google'
  });

  ServiceConfiguration.configurations.insert({
    service: 'google',
    clientId: Meteor.settings.google.clientId,
    secret: Meteor.settings.google.secret
  });

  ServiceConfiguration.configurations.remove({
    service: 'twitter'
  });

  ServiceConfiguration.configurations.insert({
    service: 'twitter',
    consumerKey: Meteor.settings.twitter.consumerKey,
    secret: Meteor.settings.twitter.secret
  });

  Accounts.emailTemplates.siteName = 'FinanceButler';
  Accounts.emailTemplates.from = 'FinanceButler <no-reply@financebutler.ru>';

  Accounts.emailTemplates.resetPassword.subject = user => {
    return TAPi18n.__('EMAIL.RESET_PASSWORD_SUBJECT', {}, user.profile.language);
  };

  Accounts.emailTemplates.resetPassword.text = (user, url) => {
    url = url.replace('#/', '');
    return TAPi18n.__('EMAIL.RESET_PASSWORD_TEXT', { url }, user.profile.language);
  };

  Accounts.emailTemplates.verifyEmail.subject = user => {
    return TAPi18n.__('EMAIL.CONFIRM_EMAIL_SUBJECT', {}, user.profile.language);
  };

  Accounts.emailTemplates.verifyEmail.text = (user, url) => {
    url = url.replace('#/', '');
    return TAPi18n.__('EMAIL.CONFIRM_EMAIL_TEXT', { url }, user.profile.language);
  };

  if (G.CurrenciesCollection.find().count() === 0) {
    Logstar.info('Load CurrenciesFixtures');

    G.CurrenciesFixtures.forEach(currency => {
      G.CurrenciesCollection.insertTranslations(_.omit(currency, 'translate'), currency.translate);
    });
  }

  // Generate demo user
  G.UserGenerator('demo@demo', 'demo@demo');
});
