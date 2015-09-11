SyncedCron.config({
  log: true,
  logger: log => {
    log.level = log.level === 'debug' ? 'log' : log.level;
    Logstar[log.level](`${log.tag}: ${log.message}`);
  },
  collectionName: 'cronHistory',
  utc: true,
  collectionTTL: 172800,
});

SyncedCron.add({
  name: 'Update exchange rates',
  schedule: parser => {
    return parser.text('every 6 hours');
  },
  job: () => {
    Meteor.call('ExchangeRates/Update');
  },
});
