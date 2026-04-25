const dns = require('dns');
const fs = require('fs');
dns.setServers(['8.8.8.8']);
dns.resolveTxt('cluster0.ttpcycv.mongodb.net', (err, addresses) => {
  if (err) fs.writeFileSync('out_txt.json', JSON.stringify({error: err.message}));
  else fs.writeFileSync('out_txt.json', JSON.stringify(addresses));
});
