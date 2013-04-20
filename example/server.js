var amqp = require('amqp'),
  util = require('util'),
  RabbitRPC = require("rabbit-rpc");

var conn = amqp.createConnection({host:'127.0.0.1'});

var server = {
  simple_response: function(index, cb) {
    cb(null, index);
  },
  simple_error: function(index, cb) {
    cb("Error!");
  }  
};

var rpc = new RabbitRPC(conn);
rpc.createServer("test_queue", server);
