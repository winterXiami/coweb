define(["coweb/session/bayeux/cometd","coweb/util/Promise","coweb/util/lang"],function(a,b,c){var d=function(a){this.IDLE=0,this.UPDATING=1,this.UPDATED=2,this._listener=a.listener,this._bridge=a.bridge,this._joinToken=null,this._rosterToken=null,this._updaterToken=null,this._syncToken=null,this._stateReqs={},this._state=this.IDLE,this._serviceSubs={},this._serviceReqs={},this._publicRegex=/^\/bot\/(.*)/,this._privateRegex=/^\/service\/bot\/([^\/]*)\/response/,this._requestRegex=/^\/service\/bot\/([^\/]*)\/request/,this._updatePromise=null,this._updateQueue=[],this._roster=null},e=d.prototype;e.postSync=function(b,c,d,e,f){if(this._state===this.UPDATED){a.publish("/session/sync/app",{topic:b,value:c,type:d,position:e,context:f});return!0}},e.postEngineSync=function(b){if(this._state===this.UPDATED){a.publish("/session/sync/engine",{context:b});return!0}},e.postStateResponse=function(b,d,e){var f=this._stateReqs[e];f!==undefined&&(b?(d=c.clone(d),f.push({topic:b,value:d})):(f={token:e,state:f},a.publish("/service/session/updater",f),delete this._stateReqs[e]))},e.postServiceSubscribe=function(b){var c=this._serviceSubs[b];if(!c){var d=a.subscribe("/bot/"+b,this,"_onServiceBotPublish");c={count:0,token:d},this._serviceSubs[b]=c}c.count+=1},e.postServiceRequest=function(b,c,d){var e=this._serviceReqs[b];e||(this._serviceReqs[b]=e={token:null,pending:{}});if(!e.token){var f="/service/bot/"+b+"/response",g=a.subscribe(f,this,"_onServiceBotResponse");e.token=g}e.pending[d]?console.warn("bayeux.ListenerBridge: conflict in bot request topics "+d):(a.publish("/service/bot/"+b+"/request",{value:c,topic:d}),e.pending[d]=!0)},e.postServiceUnsubscribe=function(b){var c=this._serviceSubs[b];c?(c.count-=1,c.count<=0&&(c.token&&a.unsubscribe(c.token),delete this._serviceSubs[b])):delete this._serviceSubs[b]},e.initiateUpdate=function(){this._updatePromise=new b,a.addListener("/meta/subscribe",this,"_onSubscribe"),a.addListener("/meta/publish",this,"_onPublish"),this._state=this.UPDATING,this._updateQueue=[],a.batch(this,function(){this._rosterToken=a.subscribe("/session/roster/*",this,"_onSessionRoster"),this._syncToken=a.subscribe("/session/sync/*",this,"_onSessionSync"),this._joinToken=a.subscribe("/service/session/join/*",this,"_onServiceSessionJoin")});return this._updatePromise},e.getInitialRoster=function(){var a=this._roster;this._roster=null;return a},e._onSubscribe=function(b){var c,d,e;if(!b.successful){var f=b.subscription,g=this._privateRegex.exec(f);if(g){d=this._serviceReqs[g[1]],a.removeListener(d.token),d.token=null,e=b.error.split(":");for(c in d.pending)d.pending.hasOwnProperty(c)&&this._listener.serviceResponseInbound(c,e[2],!0);d.pending={}}g=this._publicRegex.exec(f),g&&(d=this._serviceSubs[g[1]],a.removeListener(d.token),d.token=null,e=b.error.split(":"),this._listener.servicePublishInbound(g[1],e[2],!0))}},e._onPublish=function(b){if(!b.successful){var c=b.channel,d=this._requestRegex.exec(c);if(d){var e=this._serviceReqs[d[1]];a.removeListener(e.token),e.token=null;var f=b.error.split(":");for(var g in e.pending)e.pending.hasOwnProperty(g)&&this._listener.serviceResponseInbound(g,f[2],!0);e.pending={};return}}},e._onServiceSessionJoin=function(a){var b=a.channel.split("/");b=b[b.length-1];if(b==="siteid")this._listener.setSiteID(a.data);else if(b==="roster")this._roster=a.data;else if(b==="state"){var c=this._updatePromise;this._updatePromise=null;try{this._onServiceSessionJoinState(a)}catch(d){c.fail(new Error("bad-application-state"))}this._listener.start(this,this._bridge.prepResponse),c.resolve()}else console.warn("bayeux.ListenerBridge: unknown message "+a.channel)},e._onServiceSessionJoinState=function(b){var c,d,e;for(c=0,d=b.data.length;c<d;c++){e=b.data[c];try{this._listener.stateInbound(e.topic,e.value)}catch(f){console.warn("bayeux.ListenerBridge: application errored on received state "+f.message);throw f}}for(c=0,d=this._updateQueue.length;c<d;c++){e=this._updateQueue[c];try{this[e.mtd](e.args)}catch(g){console.warn("bayeux.ListenerBridge: application errored on queued event "+g.message);throw g}}a.batch(this,function(){a.unsubscribe(this._joinToken),this._joinToken=null,this._updaterToken=a.subscribe("/service/session/updater",this,"_onServiceSessionUpdater")}),this._state=this.UPDATED,this._updateQueue=[]},e._onSessionSync=function(a){var b=a.data;if(this._state===this.UPDATING)this._updateQueue.push({mtd:"_onSessionSync",args:a});else{var c=a.channel.split("/"),d=c[c.length-1];d==="engine"?this._listener.engineSyncInbound(b.siteId,b.context):d==="app"?this._listener.syncInbound(b.topic,b.value,b.type,b.position,b.siteId,b.context,b.order):console.warn("bayeux.ListenerBridge: received unknown sync "+c)}},e._onSessionRoster=function(a){if(this._state===this.UPDATING)this._updateQueue.push({mtd:"_onSessionRoster",args:a});else{var b=a.channel.split("/");b=b[b.length-1],b==="available"||b==="unavailable"?this._listener.noticeInbound(b,a.data):console.warn("bayeux.ListenerBridge: unknown message "+a.channel)}},e._onServiceSessionUpdater=function(a){var b=a.data;this._stateReqs[b]=[];try{this._listener.requestStateInbound(b)}catch(c){this._bridge.onDisconnected(this._bridge.id,"bad-application-state")}},e._onServiceBotPublish=function(a){var b=a.channel,c=this._publicRegex.exec(b);if(c){var d=c[1];this._listener.servicePublishInbound(d,a.data.value,!1)}else console.warn("bayeux.ListenerBridge: unknown bot publish "+b)},e._onServiceBotResponse=function(a){var b=a.channel,c=a.data.topic,d=this._privateRegex.exec(b);if(d){var e=this._serviceReqs[d[1]];if(!e.pending[c]){console.warn("bayeux.ListenerBridge: unknown bot response "+b);return}delete e.pending[c],this._listener.serviceResponseInbound(c,a.data.value,!1)}else console.warn("bayeux.ListenerBridge: unknown bot response "+b)};return d})