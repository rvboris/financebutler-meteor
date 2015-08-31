SetModule('app');

@Component('resetPassword')
@State({ name: 'resetPassword', url: '/reset-password/:token?' })
@View('client/reset-password/reset-password.html')
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$stateParams', '$filter', '$rootScope'])

class resetPassword {
  constructor ($meteor, $state, $mdToast, toastPosition, $stateParams, $filter, $rootScope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.toastPosition = toastPosition;
    this.$filter = $filter;
    this.$rootScope = $rootScope;

    if ($stateParams && $stateParams.token) {
      this.token = $stateParams.token;
    }

    this.email = '';
    this.password = '';
  }

  showError(err) {
    let errorToast = this.$mdToast
      .simple()
      .position(this.toastPosition)
      .hideDelay(3000)
      .content(T9n.get(`error.accounts.${err.reason}`));

    this.$mdToast.show(errorToast);
  }

  recovery() {
    this.$meteor.forgotPassword({email: this.email})
      .then(() => {
        let recoveryResult = this.$mdToast
          .simple()
          .position(this.toastPosition)
          .hideDelay(3000)
          .content(this.$filter('translate')('RESET_PASSWORD.CHECK_MAIL'));

        this.$mdToast.show(recoveryResult);
        this.$state.go('login');
      }.bind(this))
      .catch(this.showError.bind(this));
  }

  save() {
    this.$meteor.resetPassword(this.token, this.password)
      .then(() => this.$state.go('dashboard.overview'))
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$rootScope.loginWith(service).catch(this.showError.bind(this));
  }
}
