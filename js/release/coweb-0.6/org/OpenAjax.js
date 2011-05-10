define(function(){window.OpenAjax||(OpenAjax=new function(){var a=!0,b=!1,c=window,d,e="org.openajax.hub.",f={};this.hub=f,f.implementer="http://openajax.org",f.implVersion="1.0",f.specVersion="1.0",f.implExtraData={};var d={};f.libraries=d,f.registerLibrary=function(a,b,c,f){d[a]={prefix:a,namespaceURI:b,version:c,extraData:f},this.publish(e+"registerLibrary",d[a])},f.unregisterLibrary=function(a){this.publish(e+"unregisterLibrary",d[a]),delete d[a]},f._subscriptions={c:{},s:[]},f._cleanup=[],f._subIndex=0,f._pubDepth=0,f.subscribe=function(a,b,c,d,e){c||(c=window);var f=a+"."+this._subIndex,g={scope:c,cb:b,fcb:e,data:d,sid:this._subIndex++,hdl:f},h=a.split(".");this._subscribe(this._subscriptions,h,0,g);return f},f.publish=function(a,b){var c=a.split(".");this._pubDepth++,this._publish(this._subscriptions,c,0,a,b),this._pubDepth--;if(this._cleanup.length>0&&this._pubDepth==0){for(var d=0;d<this._cleanup.length;d++)this.unsubscribe(this._cleanup[d].hdl);delete this._cleanup,this._cleanup=[]}},f.unsubscribe=function(a){var b=a.split("."),c=b.pop();this._unsubscribe(this._subscriptions,b,0,c)},f._subscribe=function(a,b,c,d){var e=b[c];c==b.length?a.s.push(d):(typeof a.c=="undefined"&&(a.c={}),typeof a.c[e]=="undefined"?(a.c[e]={c:{},s:[]},this._subscribe(a.c[e],b,c+1,d)):this._subscribe(a.c[e],b,c+1,d))},f._publish=function(a,b,c,d,e){if(typeof a!="undefined"){var f;c==b.length?f=a:(this._publish(a.c[b[c]],b,c+1,d,e),this._publish(a.c["*"],b,c+1,d,e),f=a.c["**"]);if(typeof f!="undefined"){var g=f.s,h=g.length;for(var i=0;i<h;i++)if(g[i].cb){var j=g[i].scope,k=g[i].cb,l=g[i].fcb,m=g[i].data;typeof k=="string"&&(k=j[k]),typeof l=="string"&&(l=j[l]),(!l||l.call(j,d,e,m))&&k.call(j,d,e,m)}}}},f._unsubscribe=function(a,b,c,d){if(typeof a!="undefined"){if(c<b.length){var e=a.c[b[c]];this._unsubscribe(e,b,c+1,d);if(e.s.length==0){for(var f in e.c)return;delete a.c[b[c]]}return}var g=a.s,h=g.length;for(var i=0;i<h;i++)if(d==g[i].sid){this._pubDepth>0?(g[i].cb=null,this._cleanup.push(g[i])):g.splice(i,1);return}}},f.reinit=function(){for(var a in OpenAjax.hub.libraries)delete OpenAjax.hub.libraries[a];OpenAjax.hub.registerLibrary("OpenAjax","http://openajax.org/hub","1.0",{}),delete OpenAjax._subscriptions,OpenAjax._subscriptions={c:{},s:[]},delete OpenAjax._cleanup,OpenAjax._cleanup=[],OpenAjax._subIndex=0,OpenAjax._pubDepth=0}},OpenAjax.hub.registerLibrary("OpenAjax","http://openajax.org/hub","1.0",{}));return OpenAjax})