SetModule('app');

@State({ name: 'dashboard', url: '/dashboard', abstract: true })
@View('client/dashboard/dashboard.html')
@Inject(['dashboard', '$scope'])

export class dashboard {
  constructor(dashboard, $scope) {
    $scope.$meteorAutorun(() => {
      $scope.$meteorSubscribe('usersAccounts').then(() => {
        this.accounts = $scope.$meteorObject(G.UsersAccountsCollection, { userId: Meteor.userId() }, false).accounts;
      }.bind(this));

      $scope.$meteorSubscribe('usersCategories').then(() => {
        this.categories = $scope.$meteorObject(G.UsersCategoriesCollection, { userId: Meteor.userId() }, false).categories;
      }.bind(this));

      this.currency = $scope.$meteorObject(G.CurrenciesCollection, Meteor.user().profile.currencyId);
    }.bind(this));
  }

  static resolve = {
    currentUser: $meteor => $meteor.requireUser(),
  }
}
