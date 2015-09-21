_ = lodash;

Meteor.startup(() => {
  if (process.env.METEOR_ENV !== Meteor.settings.public.env) {
    throw new Meteor.Error('ERROR.INVALID_CONFIG_ENV', 'Config env not equal METEOR_ENV');
  }

  if (Meteor.settings.public.env === 'production') {
    Logstar.isLocal = false;
  } else if (Meteor.settings.public.env === 'development' && Package['xolvio:cleaner']) {
    Package['xolvio:cleaner'].resetDatabase();
  }

  Logstar.allow({
    log: () => {
      return true;
    },
  });

  Mandrill.config({
    username: Meteor.settings.mandrill.user,
    key: Meteor.settings.mandrill.key,
  });

  Logstar.info('Setup Accounts');

  Accounts.config({
    sendVerificationEmail: true,
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

    if (!user.profile.currencyId) {
      user.profile.currencyId = G.CurrenciesCollection.findOne({ code: 'RUB' })._id;
    }

    return user;
  });

  ServiceConfiguration.configurations.remove({
    service: 'facebook',
  });

  ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: Meteor.settings.facebook.appId,
    secret: Meteor.settings.facebook.secret,
  });

  ServiceConfiguration.configurations.remove({
    service: 'google',
  });

  ServiceConfiguration.configurations.insert({
    service: 'google',
    clientId: Meteor.settings.google.clientId,
    secret: Meteor.settings.google.secret,
  });

  ServiceConfiguration.configurations.remove({
    service: 'twitter',
  });

  ServiceConfiguration.configurations.insert({
    service: 'twitter',
    consumerKey: Meteor.settings.twitter.consumerKey,
    secret: Meteor.settings.twitter.secret,
  });

  Accounts.emailTemplates.headers = {
    'X-MC-AutoText': true,
  };

  Accounts.emailTemplates.siteName = 'Finance Butler';
  Accounts.emailTemplates.from = 'Finance Butler <robot@financebutler.ru>';

  Accounts.emailTemplates.resetPassword.subject = user => {
    return TAPi18n.__('EMAIL.RESET_PASSWORD_SUBJECT', {}, user.profile.language);
  };

  Accounts.emailTemplates.resetPassword.html = (user, url) => {
    let result;

    try {
      result = Mandrill.templates.render({
        template_name: `reset-password-${user.profile.language}`,
        template_content: [],
        merge_vars: [
          {
            name: 'resetPasswordLink',
            content: url.replace('#/', ''),
          },
        ],
      });
    } catch (error) {
      Logstar.error(error);
      return TAPi18n.__('EMAIL.RESET_PASSWORD_TEXT', { url: url.replace('#/', '') }, user.profile.language);
    }

    return result.data.html;
  };

  Accounts.emailTemplates.verifyEmail.subject = user => {
    return TAPi18n.__('EMAIL.CONFIRM_EMAIL_SUBJECT', {}, user.profile.language);
  };

  Accounts.emailTemplates.verifyEmail.html = (user, url) => {
    let result;

    try {
      result = Mandrill.templates.render({
        template_name: `verify-email-${user.profile.language}`,
        template_content: [],
        merge_vars: [
          {
            name: 'confirmLink',
            content: url.replace('#/', ''),
          },
        ],
      });
    } catch (error) {
      Logstar.error(error);
      return TAPi18n.__('EMAIL.CONFIRM_EMAIL_TEXT', { url: url.replace('#/', '') }, user.profile.language);
    }

    return result.data.html;
  };

  if (G.CurrenciesCollection.find().count() === 0) {
    Logstar.info('Load CurrenciesFixtures');

    G.CurrenciesFixtures.forEach(currency => {
      G.CurrenciesCollection.insertTranslations(_.omit(currency, 'translate'), currency.translate);
    });
  }

  SyncedCron.start();

  Meteor.call('ExchangeRates/Update');

  Meteor.call('velocity/isMirror', (err, isMirror) => {
    if (isMirror) {
      return;
    }

    if (Meteor.settings.public.env === 'production') {
      const demoUser = Meteor.users.findOne({ 'emails.address': 'demo@demo' });

      if (demoUser) {
        Meteor.users.remove(demoUser._id);
      }
    }

    if (process.env.TRAVIS) {
      return;
    }

    G.generateUser('demo@demo', 'demo@demo');
  });
});
