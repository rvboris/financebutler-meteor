SetModule('app');

@Component('operations')
@View('client/operations/operations.html')
@State({
  name: 'app.dashboard.operations',
  url: '/operations',
})

export class operations {}
