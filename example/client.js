//exmaple on how to use amqprpc
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
