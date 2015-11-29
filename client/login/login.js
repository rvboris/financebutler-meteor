SetModule('app');

@Component('login')
@View('client/login/login.html')
@State({ name: 'app.login', url: '/login' })
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$scope'])

export class login {
  constructor($meteor, $state, $mdToast, toastPosition, $scope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
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
      .content(T9n.get(`error.accounts.${err.reason}`));

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
