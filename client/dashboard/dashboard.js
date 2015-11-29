SetModule('app');

@Component('dashboard')
@View('client/dashboard/dashboard.html')
@State({
  name: 'app.dashboard',
  url: '/dashboard',
  abstract: true,
})
@Inject(['$state', '$scope', '$mdBottomSheet', '$mdSidenav'])

export class dashboard {
  constructor($state, $scope, $mdBottomSheet, $mdSidenav) {
    this.$state = $state;
    this.$mdBottomSheet = $mdBottomSheet;
    this.$mdSidenav = $mdSidenav;

    $scope.$meteorSubscribe('usersAccounts').then(() => {
      this.accounts = $scope.$meteorObject(G.UsersAccountsCollection, { userId: Meteor.userId() }).accounts;
    });

    $scope.$meteorSubscribe('usersCategories').then(() => {
      this.categories = $scope.$meteorObject(G.UsersCategoriesCollection, { userId: Meteor.userId() });
    });

    this.currency = $scope.$meteorObject(G.CurrenciesCollection, Meteor.user().profile.currencyId);
  }

  static resolve = {
    currentUser: $meteor => $meteor.requireUser(),
  }

  toggleSidenav() {
    const pending = this.$mdBottomSheet.hide() || $q.when(true);

    pending.then(() => {
      this.$mdSidenav('left').toggle();
    });
  }
}
