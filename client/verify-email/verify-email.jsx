SetModule('app');

@State({ name: 'verifyEmail', url: '/verify-email/:token' })
@Inject(['$stateParams', '$state', '$meteor', '$mdToast', 'toastPosition', '$filter'])

class verifyEmail {
  constructor ($stateParams, $state, $meteor, $mdToast, toastPosition, $filter) {
    $meteor.verifyEmail($stateParams.token)
      .then(() => {
        $state.go('dashboard.overview')
          .then(() => {
            let resultToast = $mdToast
              .simple()
              .position(toastPosition)
              .hideDelay(3000)
              .content($filter('translate')('VERIFY_EMAIL.EMAIL_VERIFIED'));

            $mdToast.show(resultToast);
          });
      })
      .catch(err => {
        $state.go('home').then(() => {
          let errorToast = $mdToast
            .simple()
            .position(toastPosition)
            .hideDelay(3000)
            .content(T9n.get(`error.accounts.${err.reason}`));

          $mdToast.show(errorToast);
        });
      });
  }
}
