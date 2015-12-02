SetModule('app');

@Component('reset-password')
@View('client/reset-password/reset-password.html')
@State({ name: 'app.resetPassword', url: '/reset-password/:token?'})
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$stateParams', '$filter', '$scope'])

export class resetPassword {
  constructor($meteor, $state, $mdToast, toastPosition, $stateParams, $filter, $scope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.toastPosition = toastPosition;
    this.$filter = $filter;
    this.$scope = $scope;

    if ($stateParams && $stateParams.token) {
      this.token = $stateParams.token;
    }

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

  recovery() {
    this.$meteor.forgotPassword({email: this.email})
      .then(() => {
        const recoveryResult = this.$mdToast
          .simple()
          .position(this.toastPosition)
          .hideDelay(3000)
          .content(this.$filter('translate')('RESET_PASSWORD.CHECK_MAIL'));

        this.$mdToast.show(recoveryResult);
        this.$state.go('app.login');
      })
      .catch(this.showError.bind(this));
  }

  save() {
    this.$meteor.resetPassword(this.token, this.password)
      .then(() => this.$state.go('app.dashboard.overview'))
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$scope.$parent.app.loginWith(service).catch(this.showError.bind(this));
  }
}
