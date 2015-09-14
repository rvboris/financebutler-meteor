angular.extend(window, angular2now);

angular2now.options({ controllerAs: 'vm' });

SetModule('app', [
  'angular-meteor',
  'ui.router',
  'ngMaterial',
  'ngMdIcons',
  'ngMessages',
  'validation.match',
])
.constant('toastPosition', 'bottom right')
.config(($urlRouterProvider, $locationProvider, $mdThemingProvider) => {
  $urlRouterProvider.otherwise('/home');
  $locationProvider.html5Mode(true);

  $mdThemingProvider.theme('default')
    .primaryPalette('teal')
    .accentPalette('brown');
})
.run(($rootScope, $state, $mdToast, toastPosition, $filter, $meteor, $interval) => {
  $meteor.session('translateReady').bind($rootScope, 'translateReady');

  $rootScope.state = $state;

  const stateChangeErrorHandler = $rootScope.$on('$stateChangeError', (event, toState, toParams, fromState, fromParams, error) => {
    if (error === 'AUTH_REQUIRED') {
      $state.go('login')
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

    $state.go('home');
  });

  $rootScope.loginWith = (service) => {
    return $meteor['loginWith' + service]()
      .then(() => {
        if (!Meteor.user().profile.language && !Meteor.user().profile.utcOffset) {
          Meteor.users.update(Meteor.userId(), {
            $set: {
              'profile.utcOffset': moment().utcOffset(),
              'profile.language': TAPi18n.getLanguage(),
            },
          });
        }

        return $state.go('dashboard.overview');
      });
  };

  let deferState = true;
  let translateCheckInterval;

  const stateChangeStartHandler = $rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
    if (!$rootScope.translateReady) {
      event.preventDefault();

      if (!translateCheckInterval) {
        translateCheckInterval = $interval(() => {
          if (!$rootScope.translateReady) {
            return;
          }

          $interval.cancel(translateCheckInterval);
          $state.go(toState.name, toParams);
        }, 50);
      }

      return;
    }

    if (['login', 'register', 'resetPassword'].indexOf(toState.name) >= 0 && deferState) {
      event.preventDefault();

      deferState = false;

      $meteor.waitForUser()
        .then(user => {
          if (user) {
            $rootScope.state.go('dashboard.overview');
          } else {
            $state.go(toState.name, toParams);
          }

          deferState = true;
        });
    }

    $rootScope.$on('$destroy', () => {
      stateChangeErrorHandler();
      stateChangeStartHandler();
    });
  });

  $rootScope.$meteorAutorun(() => {
    TAPi18n.subscribe('currencies', 1800);
    $rootScope.currencies = $rootScope.$meteorCollection(G.CurrenciesCollection);

    $rootScope.$meteorSubscribe('exchangeRates').then(() => {
      $rootScope.exchangeRates = $rootScope.$meteorObject(G.ExchangeRatesCollection, {}).rates;
    });
  });
});

@Component('app')
@View('client/app/app.html')

class app {}

bootstrap(app);
