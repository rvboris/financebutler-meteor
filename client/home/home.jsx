SetModule('app');

@Component('home')
@State({ name: 'home', url: '/home', defaultRoute: true })
@View('client/home/home.html')

class home {}
