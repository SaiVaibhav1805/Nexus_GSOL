const dns = require('dns');
const fs = require('fs');
dns.setServers(['8.8.8.8']);
dns.resolveSrv('_mongodb._tcp.cluster0.ttpcycv.mongodb.net', (err, addresses) => {
  if (err) fs.writeFileSync('out.json', JSON.stringify({error: err.message}));
  else fs.writeFileSync('out.json', JSON.stringify(addresses));
});
