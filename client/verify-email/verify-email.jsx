SetModule('app');

@State({ name: 'app.verifyEmail', url: '/verify-email/:token' })
@Inject(['$stateParams', '$state', '$meteor', '$mdToast', 'toastPosition', '$filter'])

export class verifyEmail {
  constructor($stateParams, $state, $meteor, $mdToast, toastPosition, $filter) {
    $meteor.verifyEmail($stateParams.token)
      .then(() => {
        $state.go('dashboard.overview')
          .then(() => {
            const resultToast = $mdToast
              .simple()
              .position(toastPosition)
              .hideDelay(3000)
              .content($filter('translate')('VERIFY_EMAIL.EMAIL_VERIFIED'));

            $mdToast.show(resultToast);
          });
      })
      .catch(err => {
        $state.go('home').then(() => {
          const errorToast = $mdToast
            .simple()
            .position(toastPosition)
            .hideDelay(3000)
            .content(T9n.get(`error.accounts.${err.reason}`));

          $mdToast.show(errorToast);
        });
      });
  }
}
