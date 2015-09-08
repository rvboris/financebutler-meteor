describe('users', () => {
  const login = 'test@test';
  const password = 'test@test';

  const testUserId = Accounts.createUser({
    email: login,
    password: password,
    profile: {
      utfOffset: 180,
      language: 'ru',
    },
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
});
