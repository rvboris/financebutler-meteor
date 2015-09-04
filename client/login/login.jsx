SetModule('app');

@Component('login')
@State({ name: 'login', url: '/login' })
@View('client/login/login.html')
@Inject(['$meteor', '$state', '$mdToast', 'toastPosition', '$rootScope'])

export class login {
  constructor($meteor, $state, $mdToast, toastPosition, $rootScope) {
    this.$meteor = $meteor;
    this.$state = $state;
    this.$mdToast = $mdToast;
    this.toastPosition = toastPosition;
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

  login() {
    this.$meteor.loginWithPassword(this.email, this.password)
      .then(() => {
        this.$state.go('dashboard.overview');
      }.bind(this))
      .catch(this.showError.bind(this));
  }

  loginWith(service) {
    this.$rootScope.loginWith(service).catch(this.showError.bind(this));
  }
}
