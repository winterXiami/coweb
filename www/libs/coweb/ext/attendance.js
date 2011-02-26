//
// Tracks session attendance by roster changes.
//
// Copyright (c) The Dojo Foundation 2011. All Rights Reserved.
// Copyright (c) IBM Corporation 2008, 2011. All Rights Reserved.
//
/*global define*/
define([
    'coweb/main',
    'coweb/util/Promise'
], function(coweb, Promise) {
    var attendance = {
        // all attendees, read-only externally
        users : {},
        // total attendee count, read-only externally
        count : 0,
        // subscriptions
        _subs : {},
        // next subscription id
        _subId : 0,
        _subscribe : function(context, callback) {
            if(callback === undefined) {
                callback = context;
                context = this;
            }
            if(typeof callback !== 'function') {
                callback = context[callback];
                if(typeof callback !== 'function') {
                    throw new Error('callback must be a function');
                }
            }
            var id = this._subId;
            this._subs[id] = {
                context : context,
                callback : callback
            };
            this._subId++;
            return id;
        },
        
        _notify : function(user, count) {
            var subs = this._subs;
            for(var id in subs) {
                if(subs.hasOwnProperty(id)) {
                    var s = subs[id];
                    try {
                        s.callback.call(s.context, user, count);
                    } catch(e) {
                        console.error(e);
                    }
                }
            }
        },

        /**
         * Subscribes to roster change events.
         *
         * @param context Context in which to invoke the callback
         * @param callback Function to invoke
         * @return Promise which always notifies success
         */
        subscribeChange: function(context, callback) {
            var tok = this._subscribe(context, callback);
            var promise = new Promise();
            promise._cowebToken = tok;
            promise.resolve();
            return promise;
        },

        /**
         * Unsubscribes any subscription created via this interface.
         *
         * @param promise Promise returned from subscribe method
         */
        unsubscribe: function(promise) {
            var tok = promise._cowebToken;
            if(tok) {
                delete this._subs[tok];
            }
        },
        
        /**
         * Unsubscribes all listeners.
         */
         unsubscribeAll: function() {
            for(var id in this._subs) {
                if(this._subs.hasOwnProperty(id)) {
                    delete this._subs[id];
                }
            }
         },

        /**
         * Called when the application enters a session.
         */
        _onLocalJoin: function(params) {
            var users = [];
            for(var site in params.roster) {
                var username = params.roster[site];
                users.push(this._addUser(site, username, false));
            }
            // notify about all existing users all at once
            this._notify(users, this.count);

            var user = this._addUser(params.site, params.username, true);
            if(user) {
                // notify about local user
                this._notify([user], this.count);
            }
        },

        /**
         * Called when a remote app indicates it is fully joined to the conference.
         */
        _onRemoteJoin: function(params) {
            var user = this._addUser(params.site, params.username, false);
            if(user) {
                this._notify([user], this.count);
            }
        },
    
        /**
         * Called when this app sees a remote app leave the conference.
         */
        _onRemoteLeave: function(params) {
            var user = this._removeUser(params.site);
            if(user) {
                this._notify([user], this.count);
            }
        },

        /**
         * Add a new user to track.
         *
         * @param site Unique site integer of the user
         * @param username Human readable string name of the user
         * @return User object
         */
        _addUser: function(site, username, local) {
            var user = this.users[site];
            // don't increment count or construct a user
            if(user) { return; }
            ++this.count;
            // build a user object
            user = {site : Number(site), username : username, local : local};
            // store it
            this.users[site] = user;
            return user;
        },

        /**
         * Stop tracking a user.
         *
         * @param site Unique site integer of the user
         * @return User object
         */
        _removeUser: function(site) {
            // get the user
            var user = this.users[site];
            // decrement count if user exists
            if(user) { --this.count; }
            // remove the stored user
            delete this.users[site];
            return user;
        }
    };

    // connect to collab events
    var collab = coweb.initCollab({id : 'coweb-ext-attendance'});
    collab.subscribeConferenceReady(attendance, '_onLocalJoin');
    collab.subscribeSiteJoin(attendance, '_onRemoteJoin');
    collab.subscribeSiteLeave(attendance, '_onRemoteLeave');
    return attendance;
});