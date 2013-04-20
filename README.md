amqp-rpc
========

an AMQP (RabbitMQ) RPC implementation that supports verification through service ticket.


### Service Ticket Validation
Not yet implemented

### Basic Usage
For both the client and the server, it is incumbent upon the user to provide a RabbitMQ connection object to this module. The connection does not need to be setup, as the module will handle that internally where necassary.

#### Client

The client is a little more complex than the server, as the client relies on the user to make sure that the connection is ready before making calls to it. This should get fixed in a soon version.


A simple client might look something like this:
```
//example on how to use RabbitRPC
var amqp = require('amqp'),
  RabbitRPC = require("rabbit-rpc");

var conn = amqp.createConnection({host:'127.0.0.1'});
var rpc = new RabbitRPC(conn);
 
 
conn.on("ready", function(){
  console.log("ready");
  var outstanding=0; 
 
  outstanding++;
  rpc.request('test_queue', "simple_response", "hello", function response(err, response){
    if(err)
      console.log("error", err.message);
    else
      console.log("response", response);
    outstanding-=1;
    isAllDone();
  });
 
  outstanding++;
  rpc.request('test_queue', "simple_error", "hello", function response(err, response){
    if(err)
      console.log("error", err.message);
    else
      console.log("response", response);
    outstanding-=1;
    isAllDone();
  });
 
  function isAllDone() {
    if(outstanding === 0){
      conn.end();
    }
  }
 
});
```

#### Server
Setting up a server is a process of defining an object which contains your RPC methods, where each method accepts a number of arguments, plus a callback with the signature:

```
callback(error, response);
```

An exceedingly simple server might look something like this:

```
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

```