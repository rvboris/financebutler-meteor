angular.extend(window, angular2now);

SetModule('app', [
  'angular-meteor',
  'ui.router',
  'ngMaterial',
  'ngMdIcons',
  'ngMessages',
  'validation.match',
])
.constant('toastPosition', 'bottom right')
.config(['$urlRouterProvider', '$locationProvider', '$mdThemingProvider', ($urlRouterProvider, $locationProvider, $mdThemingProvider) => {
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(true);

  $mdThemingProvider.theme('default')
    .primaryPalette('teal')
    .accentPalette('brown');
}]);

@Component('app')
@View('client/app/app.html')
@State({ name: 'app', abstract: true, url: '' })
@Inject(['$rootScope', '$scope', '$state', '$mdToast', 'toastPosition', '$filter', '$meteor', '$interval'])

export class app {
  constructor($rootScope, $scope, $state, $mdToast, toastPosition, $filter, $meteor, $interval) {
    this.$state = $state;
    this.$meteor = $meteor;

    this.$meteor.session('translateReady').bind($scope, 'translateReady');

    const stateChangeErrorHandler = $rootScope.$on('$stateChangeError', (event, toState, toParams, fromState, fromParams, error) => {
      if (error === 'AUTH_REQUIRED') {
        this.$state.go('app.login')
          .then(() => {
            const errorToast = $mdToast
              .simple()
              .position(toastPosition)
              .hideDelay(3000)
              .content($filter('translate')('GLOBAL.AUTH_REQUIRED'));

            $mdToast.show(errorToast);
          });

        return;
      }

      this.$state.go('app.home');
    }.bind(this));

    let deferState = true;
    let translateCheckInterval;

    const stateChangeStartHandler = $rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
      if (!$scope.translateReady) {
        event.preventDefault();

        if (!translateCheckInterval) {
          translateCheckInterval = $interval(() => {
            if (!$scope.translateReady) {
              return;
            }

            $interval.cancel(translateCheckInterval);
            this.$state.go(toState.name, toParams);
          }, 50);
        }

        return;
      }

      if (['login', 'register', 'resetPassword'].indexOf(toState.name) >= 0 && deferState) {
        event.preventDefault();

        deferState = false;

        this.$meteor.waitForUser()
          .then(user => {
            if (user) {
              this.$state.go('app.dashboard.overview');
            } else {
              this.$state.go(toState.name, toParams);
            }

            deferState = true;
          }.bind(this));
      }
    }.bind(this));

    let exchangeRatesHandler = angular.noop;

    $scope.$meteorAutorun(() => {
      TAPi18n.subscribe('currencies', 1800);
      this.currencies = $scope.$meteorCollection(G.CurrenciesCollection);

      $scope.$meteorSubscribe('exchangeRates').then(() => {
        this.exchangeRates = $scope.$meteorObject(G.ExchangeRatesCollection, {}, false);

        exchangeRatesHandler = $scope.$watch(() => this.exchangeRates.getRawObject(), exchangeRates => {
          fx.rates = exchangeRates.rates;
          fx.base = exchangeRates.base;
        }, true);
      }.bind(this));
    }.bind(this));

    $scope.$on('$destroy', () => {
      stateChangeErrorHandler();
      stateChangeStartHandler();
      exchangeRatesHandler();
    });
  }

  loginWith(service) {
    return this.$meteor['loginWith' + service]()
      .then(() => {
        if (!Meteor.user().profile.language && !Meteor.user().profile.utcOffset) {
          Meteor.users.update(Meteor.userId(), {
            $set: {
              'profile.utcOffset': moment().utcOffset(),
              'profile.language': TAPi18n.getLanguage(),
            },
          });
        }

        return this.$state.go('app.dashboard.overview');
      }.bind(this));
  }
}

bootstrap(app);
