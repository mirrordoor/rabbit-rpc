"use strict";

var crypto = require("crypto"),
    amqp = require("amqp");
    
exports = module.exports = RabbitRPC;

function RabbitRPC (connection) {
    
  var conf = {};
  conf.timeout = process.env.AMQP_RPC_TIMEOUT || 2000;

  var connection = connection;
  var requests = {};
  var response = false;

  this.request = function(queue_name, method, args, cb) {
    var self = this;
    
    var doRequest = function() {    
      if (!(args instanceof Array)) args = [args];
    
      var message = {"method": method, "args": args};
    
      var correlator = crypto.randomBytes(24).toString("hex");
  
      var timeoutId = setTimeout(function(corr) {
        cb(new Error("timeout"));
        delete requests[corr];
      }, conf.timeout, correlator);
  
      requests[correlator] = { 
        "callback": cb,
        "timeout": timeoutId
      };
  
      self.responseQueue(function() {
        var options = {
          "correlationId": correlator,
          "replyTo": response
        }
        connection.publish(queue_name, message, options);
      });
    };
   
    if (connection._connecting) {
      connection.on("ready", doRequest)
    } else {
      doRequest();
    } 
  }
  



  this.responseQueue = function(next) {
    var self = this;
    // we don't need to get called multiple times
    if (response) return next();
      
    var subscribeResponses = function(message, headers, delivery, options) {
      if (delivery.correlationId in requests) {
        clearTimeout(requests[delivery.correlationId].timeout);
        var cb = requests[delivery.correlationId].callback;
        delete requests[delivery.correlationId];
        if (message.status == "OK") cb(null, message.response);
        if (message.status == "error") cb(new Error(message.response));
      }  
    };
  
    connection.queue("", {exlcusive: true}, function(queue) {
      response = queue.name;
      queue.subscribe(subscribeResponses);
      return next();
    });
  
  };
  
  this.createServer = function(queue_name, requestHandler) {
    var doRequest = function() {
      console.log("RabbitRPC listening on", queue_name);
      connection.queue(queue_name, function(q){
          q.subscribe(function(message, headers, deliveryInfo){
            var cb = function(err, rmessage) {
              var responseMessage;
              var responseOptions = { correlationId: deliveryInfo.correlationId };
              if (err) {
                responseMessage = { status: "error", response: err.message};
              }
              else {
                responseMessage = { status: "OK", response: rmessage };
              }
              connection.publish(deliveryInfo.replyTo, responseMessage, responseOptions);
            };
            message.args.push(cb);
            if (requestHandler[message.method]) requestHandler[message.method].apply(requestHandler, message.args);
            else cb(new Error("Method not found"));
          });
      });
    };
    if (connection._connecting) {
      connection.on("ready", doRequest)
    } else {
      doRequest();
    } 
  }; 

};


