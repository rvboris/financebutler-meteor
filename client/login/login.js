SetModule('app');

@Component('login')
@View('client/login/login.html')
@State({ name: 'app.login', url: '/login' })
@Inject(['$meteor', '$state', '$mdToast', '$filter', 'toastPosition', '$scope'])

export class login {
  constructor($meteor, $state, $mdToast, $filter, toastPosition, $scope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.$filter = $filter;
    this.toastPosition = toastPosition;
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

  login() {
    this.$meteor.loginWithPassword(this.email, this.password)
      .then(() => {
        this.$state.go('app.dashboard.overview');
      })
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$scope.$parent.app.loginWith(service).catch(this.showError.bind(this));
  }
}
