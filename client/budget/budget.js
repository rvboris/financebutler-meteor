SetModule('app');

@Component('budget')
@View('client/budget/budget.html')
@State({
  name: 'app.dashboard.budget',
  url: '/budget',
})

export class budget {}
