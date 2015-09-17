SetModule('app');

@Component('dashboard')
@View('client/dashboard/dashboard.html')
@State({
  name: 'app.dashboard',
  url: '/dashboard',
  templateUrl: 'client/dashboard/dashboard.html',
  abstract: true,
})
@Inject(['dashboard', '$scope'])

export class dashboard {
  constructor(dashboard, $scope) {
    $scope.$meteorSubscribe('usersAccounts').then(() => {
      this.accounts = $scope.$meteorObject(G.UsersAccountsCollection, { userId: Meteor.userId() }).accounts;
    }.bind(this));

    $scope.$meteorSubscribe('usersCategories').then(() => {
      this.categories = $scope.$meteorObject(G.UsersCategoriesCollection, { userId: Meteor.userId() });
    }.bind(this));

    this.currency = $scope.$meteorObject(G.CurrenciesCollection, Meteor.user().profile.currencyId);
  }

  static resolve = {
    currentUser: $meteor => $meteor.requireUser(),
  }
}
