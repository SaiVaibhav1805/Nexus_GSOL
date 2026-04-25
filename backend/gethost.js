const dns = require('dns');
dns.setServers(['8.8.8.8']);
dns.resolveSrv('_mongodb._tcp.cluster0.ttpcycv.mongodb.net', (err, addresses) => {
  console.log(addresses);
});
