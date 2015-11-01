SetModule('app');

@Component('home')
@View('client/home/home.html')
@State({ name: 'app.home', url: '/home', defaultRoute: true })

export class home {}
