SetModule('app');

@Component('overview')
@View('client/overview/overview.html')
@State({
  name: 'app.dashboard.overview',
  url: '/overview',
})

export class overview {}
