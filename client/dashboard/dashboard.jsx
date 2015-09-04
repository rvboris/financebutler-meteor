SetModule('app');

@State({ name: 'dashboard', url: '/dashboard', abstract: true })
@View('client/dashboard/dashboard.html')
@Inject(['dashboard'])

export class dashboard {
  constructor(dashboard) {
    this.currentUser = dashboard.currentUser;
  }

  static resolve = {
    currentUser: $meteor => $meteor.requireUser(),
  }
}
