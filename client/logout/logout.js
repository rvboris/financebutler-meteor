SetModule('app');

@State({ name: 'app.logout', url: '/logout' })
@Inject(['logout', '$state'])

export class logout {
  constructor(logout, $state) {
    $state.go('app.login');
  }

  static resolve = {
    logout: $meteor => $meteor.logout(),
  }
}
