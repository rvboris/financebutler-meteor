SetModule('app');

@Component('register')
@View('client/register/register.html')
@State({ name: 'app.register', url: '/register' })
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$filter', '$scope'])

export class register {
  constructor($meteor, $state, $mdToast, toastPosition, $filter, $scope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.toastPosition = toastPosition;
    this.$filter = $filter;
    this.$scope = $scope;

    this.email = '';
    this.password = '';
  }

  showError(err) {
    const errorToast = this.$mdToast
      .simple()
      .position(this.toastPosition)
      .hideDelay(3000)
      .content(this.$filter('t9nError')(`error.accounts.${err.reason}`));

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
        this.$state.go('app.dashboard.overview')
          .then(() => {
            const emailVerifyToast = this.$mdToast
              .simple()
              .position(this.toastPosition)
              .hideDelay(3000)
              .content(this.$filter('translate')('VERIFY_EMAIL.EMAIL_VERIFY_SENDED'));

            this.$mdToast.show(emailVerifyToast);
          });
      })
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$scope.$parent.app.loginWith(service).catch(this.showError.bind(this));
  }
}
