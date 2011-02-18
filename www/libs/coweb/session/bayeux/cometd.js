//
// Binding for CometD that uses pure browser features, no toolkits.
//
// Copyright (c) The Dojo Foundation 2011. All Rights Reserved.
// Copyright (c) IBM Corporation 2008, 2011. All Rights Reserved.
//
/*global define */
define([
    'coweb/util/xhr',
    'org/cometd'
], function(xhr, cometd) {
    // @todo: nicer error if undefined in browser
    // use browser native functions, http://caniuse.com/#search=JSON
    cometd.JSON.toJSON = JSON.stringify;
    cometd.JSON.fromJSON = JSON.parse;
    
    // build default instance
    var c = new cometd.Cometd();

    // implement abstract methods in required transports
    var LongPollingTransport = function() {
        var _super = new cometd.LongPollingTransport();
        var that = cometd.Transport.derive(_super);
        // implement abstract method
        that.xhrSend = function(packet) {
            packet.method = 'POST';
            packet.headers = packet.headers || {};
            packet.headers['Content-Type'] = 'application/json;charset=UTF-8';
            return xhr.send(packet);
        };
        return that;
    };

    // register transports
    // @todo: websocket disabled for now, make this a config option
    // if (window.WebSocket) {
    //     cometd.registerTransport('websocket', new org.cometd.WebSocketTransport());
    // }
    c.registerTransport('long-polling', new LongPollingTransport());
    
    // register required extension
    c.registerExtension('ack', new cometd.AckExtension());
    return c;
});