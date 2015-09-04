SetModule('app');

@Component('register')
@State({ name: 'register', url: '/register' })
@View('client/register/register.html')
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$filter', '$rootScope'])

export class register {
  constructor($meteor, $state, $mdToast, toastPosition, $filter, $rootScope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.toastPosition = toastPosition;
    this.$filter = $filter;
    this.$rootScope = $rootScope;

    this.email = '';
    this.password = '';
  }

  showError(err) {
    const errorToast = this.$mdToast
      .simple()
      .position(this.toastPosition)
      .hideDelay(3000)
      .content(T9n.get(`error.accounts.${err.reason}`));

    this.$mdToast.show(errorToast);
  }

  register() {
    this.$meteor.createUser({
      email: this.email,
      password: this.password,
      profile: {
        utcOffset: moment().utcOffset(),
        language: TAPi18n.getLanguage(),
      },
    })
      .then(() => {
        this.$state.go('dashboard.overview')
          .then(() => {
            const emailVerifyToast = this.$mdToast
              .simple()
              .position(this.toastPosition)
              .hideDelay(3000)
              .content(this.$filter('translate')('VERIFY_EMAIL.EMAIL_VERIFY_SENDED'));

            this.$mdToast.show(emailVerifyToast);
          });
      }.bind(this))
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$rootScope.loginWith(service).catch(this.showError.bind(this));
  }
}
