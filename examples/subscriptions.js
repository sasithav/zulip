const config = {
  username: process.env.ZULIP_USERNAME,
  apiKey: process.env.ZULIP_APIKEY,
  realm: process.env.ZULIP_REALM,
};

const zulip = require('../lib/');

// Prints
//   { msg: '',
//     subscribed: { 'aero31aero@gmail.com': [ 'off topic' ] },
//     already_subscribed: {},
//     result: 'success' }

const params = {
  subscriptions: JSON.stringify([{ name: 'off topic' }]),
};

zulip(config).then((z) => {
  z.users.me.subscriptions.add(params).then((data) => {
    console.log(data);
  });
});
