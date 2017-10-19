// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    main: {
      network_id: 1,
      host: "127.0.0.1",
      port: 8545,
	  gas: 4712388,
	  from: "0xa165950EfE0Bce322AbB1Fe9FF3Bf16a73628D04"
    },

    dev: {
      host: "x.x.x.x",
      port: 8545,
      network_id: "*",
	  gas: 4712388
    },
	
    local: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
	  gas: 4712388
    }
  }
};