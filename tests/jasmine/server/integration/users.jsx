describe('users', () => {
  let login;
  let password;
  let testUserId;

  beforeAll(() => {
    login = 'test@users';
    password = 'test@users';

    testUserId = Accounts.createUser({
      email: login,
      password: password,
      profile: {
        utfOffset: 180,
        language: 'ru',
      },
    });
  });

  it('test user is available in the collection', () => {
    expect(Meteor.users.findOne(testUserId)).not.toBeUndefined();
  });

  it('test user has default accounts', () => {
    expect(G.UsersAccountsCollection.findOne({userId: testUserId}).accounts).not.toBeUndefined();
  });

  it('test user has default categories', () => {
    expect(G.UsersCategoriesCollection.findOne({userId: testUserId}).categories).not.toBeUndefined();
  });

  it('remove user', () => {
    Meteor.users.remove(testUserId);

    expect(Meteor.users.find(testUserId).count()).toBe(0);
    expect(G.UsersAccountsCollection.find({userId: testUserId}).count()).toBe(0);
    expect(G.UsersCategoriesCollection.find({userId: testUserId}).count()).toBe(0);
  });
});
