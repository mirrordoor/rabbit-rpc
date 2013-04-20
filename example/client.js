//exmaple on how to use amqprpc
var amqp = require('amqp'),
  RabbitRPC = require("rabbit-rpc");

var conn = amqp.createConnection({host:'127.0.0.1'});
var rpc = new RabbitRPC(conn);
 
var toDo=0; 

toDo++;
rpc.request('test_queue', "simple_response", "hello", function response(err, response){
  if(err)
    console.log("error", err.message);
  else
    console.log("response", response);
  toDo-=1;
  isToDone();
});

toDo++;
rpc.request('test_queue', "simple_error", "hello", function response(err, response){
  if(err)
    console.log("error", err.message);
  else
    console.log("response", response);
  toDo-=1;
  isToDone();
});

function isToDone() {
  if(toDo === 0){
    conn.end();
  }
}
