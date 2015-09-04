SetModule('app');

@State({ name: 'logout', url: '/logout' })
@Inject(['logout', '$state'])

export class logout {
  constructor(logout, $state) {
    $state.go('login');
  }

  static resolve = {
    logout: $meteor => $meteor.logout(),
  }
}
