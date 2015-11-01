SetModule('app');

@Component('reports')
@View('client/reports/reports.html')
@State({
  name: 'app.dashboard.reports',
  url: '/reports',
})

export class reports {}
