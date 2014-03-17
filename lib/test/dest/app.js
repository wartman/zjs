/*test.src.main*/
(function(root){

/*! zjs */
var forEach=Array.prototype.forEach,slice=Array.prototype.slice,toString=Object.prototype.toString,objKeys=Object.keys,undef,u={};u.each=function(t,e,i){if(!t)return t;if(i=i||t,forEach&&t.forEach)t.forEach(e);else if(u.isArray(t))for(var n=0;n<t.length&&(!t[n]||!e.call(i,t[n],n,t));n+=1);else for(var r in t)if(t.hasOwnProperty(r)&&r&&e.call(i,t[r],r,t))break;return t},u.eachReverse=function(t,e,i){if(t){var n;for(n=t.length-1;n>-1&&(!t[n]||!e.call(i,t[n],n,t));n-=1);}return t},u.extend=function(t){return u.each(slice.call(arguments,1),function(e){if(e)for(var i in e)t[i]=e[i]}),t},u.isObject=function(t){return t===Object(t)},u.defaults=function(t,e){if(void 0===e)return t;for(var i in t)t.hasOwnProperty(i)&&!e.hasOwnProperty(i)&&(e[i]=t[i]);return e},u.keys=function(t){if(!u.isObject(t))return[];if(objKeys)return objKeys(t);var e=[];for(var i in t)e.push(i);return e},u.isEmpty=function(t){if(null==t)return!0;if(t instanceof Array||t instanceof String)return 0===t.length;for(var e in t)if(t.hasOwnProperty(e))return!1;return!0},u.each(["Arguments","Function","String","Number","Date","RegExp"],function(t){u["is"+t]=function(e){return toString.call(e)=="[object "+t+"]"}}),u.isArray=Array.isArray||function(t){return"[object Array]"==toString.call(t)};var z=root.z=function(t,e){if(u.isFunction(t)&&(e=t,t=undef),z.has(t)&&!e)return z.modules[t];var i=_addModule(t);return u.isFunction(e)&&2===e.length?_runFactory(i,e):e&&i.exports(e),i},_lastModule=root.module;root.module=z,z.noConflict=function(){root.module=_lastModule};var _addModule=function(t){if("undefined"==typeof t){var e;if(!_useInteractive)return _tmpModule=new Module;e=_currentlyAddingScript||Script.getInteractiveScript(),t=e.getAttribute("data-from")}return z.modules[t]=new Module,z.modules[t]},_runFactory=function(t,e){var i=function(){return Module.prototype.imports.apply(t,arguments)},n=function(){return Module.prototype.exports.apply(t,arguments)};e.call(t,i,n)},_tmpModule=null;z.modules={},z.has=function(t){return z.modules.hasOwnProperty(t)},z.ensureModule=function(t){var e=_tmpModule;null!==e&&(_tmpModule=null,!e instanceof Module||(z.modules[t]=e))},z.config={root:"",shim:{},alias:{},env:"browser"},z.setup=function(t){z.config=u.defaults(z.config,t)};var fnTest=/xyz/.test(function(){})?/\b__super__\b/:/[\D|\d]*/,_classExtend=function(t){var e=this.prototype,i=this,n=u.isFunction(t.__new__)?function(){var e=t.__new__;return delete t.__new__,e}():function(){i.apply(this,arguments)},r=function(){this.constructor=n};r.prototype=this.prototype,n.prototype=new r;for(var o in t)n.prototype[o]=u.isFunction(t[o])&&u.isFunction(e[o])&&fnTest.test(t[o])?function(t,i){return function(){var n=this.__super__;this.__super__=e[t];var r=i.apply(this,arguments);return this.__super__=n,r}}(o,t[o]):t[o];return n.prototype.constructor=n,n.extend=arguments.callee,n},_classConstructor=function(){this.__init__&&this.__init__.apply(this,arguments)};z.Class=function(t,e){if(e||(e=t,t=!1),!t)return _classExtend.call(_classConstructor,e);if(t&&hasOwnProperty.call(t,"extend"))return t.extend(e);if(u.isFunction(t))return _classExtend.call(t,e);if(u.isObject(t))return t.__new__=_classConstructor,_classExtend.call(t,e);throw new TypeError("{parent} must be a function, object or undefined.")};var RESOLVER_STATE={PENDING:0,READY:1,REJECTED:-1},Resolver=z.Resolver=z.Class({__new__:function(){this._onReady=[],this._onRejected=[],this._value=null,this._state=RESOLVER_STATE.PENDING,this.__init__&&this.__init__.apply(this,arguments)},done:function(t,e){return t&&(this.isReady()?t(this._value):this._onReady.push(t)),e&&(this.isRejected()?e(this._value):this._onRejected.push(e)),this},failed:function(t){return this.ready(void 0,t)},then:function(t){return this.ready(t,onFailed)},resolve:function(t){this._value=t,this._state=RESOLVER_STATE.READY,this._dispatch(this._onReady)},reject:function(t){this._value=t,this._state=RESOLVER_STATE.REJECTED,this._dispatch(this._onRejected)},_dispatch:function(t){for(var e=this._value,i=this;t.length;){var n=t.shift();n.call(i,e)}}});u.each(["Ready","Rejected","Pending"],function(t){var e=t.toUpperCase();Resolver.prototype["is"+t]=function(){return this._state===RESOLVER_STATE[e]}});var Script=z.Script=Resolver.extend({options:{nodeType:"text/javascript",charset:"utf-8",async:!0},__init__:function(t,e){this.options=u.defaults(this.options,e),this.node=!1,this.load(t)},create:function(){var t=document.createElement("script");return t.type=this.options.nodeType||"text/javascript",t.charset=this.options.charset,t.async=this.options.async,t},load:function(t){var e=this.create(),i=document.getElementsByTagName("head")[0],n=this,r=(this.scriptSettings,{src:""});u.isString(t)&&(t={src:t}),t=u.defaults(r,t),e.setAttribute("data-from",t.from||t.src),_scriptLoadEvent(e,function(t){n.resolve(t)},function(t){n.reject(t)}),_currentlyAddingScript=e,e.src=t.src,i.appendChild(e),_currentlyAddingScript=null}}),_useInteractive=!1,_currentlyAddingScript=null,_interactiveScript=null;Script.getInteractiveScript=function(){return _interactiveScript&&"interactive"===_interactiveScript.readyState?_interactiveScript:(u.eachReverse(Script.scripts(),function(t){return"interactive"===t.readyState?(_interactiveScript=t,!0):void 0}),_interactiveScript)},Script.scripts=function(){return document.getElementsByTagName("script")};var _scriptLoadEvent=function(){if("undefined"==typeof document)return function(){};var t=document.createElement("script"),e=null;return e=t.attachEvent?function(t,e){_useInteractive=!0,t.attachEvent("onreadystatechange",function(){"complete"===t.readyState&&(e(t),_interactiveScript=null)})}:function(t,e,i){t.addEventListener("load",function(){e(t)},!1),t.addEventListener("error",function(t){i(t)},!1)}}();z.script=function(t,e,i){var n=new Script(t,z.config.script);return n.done(e,i),n};var AJAX_STATE={PENDING:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4,FAILED:-1},HTTP_METHODS=["GET","PUT","POST","DELETE"],Ajax=z.Ajax=Resolver.extend({options:{defaults:{src:"",method:"GET",data:!1}},__init__:function(t,e){this.options=u.defaults(this.options,e),this.load(t)},load:function(t){var e,i=this,n="GET";if(t=u.defaults(this.options.defaults,t),n="GET"===t.method.toUpperCase(),HTTP_METHODS.indexOf(n)<=0&&(n="GET"),e=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),e.onreadystatechange=function(){AJAX_STATE.DONE===this.readyState&&(200===this.status?i.resolve(this.responseText):i.reject(this.status))},"GET"===n&&t.data&&(t.src+="?"+this._buildQueryStr(t.data)),e.open(n,t.src,!0),"POST"===n&&t.data){var r=this._buildQueryStr(t.data);e.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),e.send(r)}else e.send()},_buildQueryStr:function(t){var e=[];for(var i in t)e.push(i+"="+t[i]);return e.join("&")}});u.each(["Done","Pending","Failed"],function(t){Ajax.prototype["is"+t]=function(){return this._state===AJAX_STATE[t.toUpperCase()]}}),z.ajax=function(t,e,i){var n=new Ajax(t,z.config.ajax);return n.done(e,i),n};var Loader=function(t){this._queue={},t=t||{},this._filters=t.filters||["default.src"],this.options=u.defaults(this.options,t.options),this._method=t.method||z.Script,this._handler=t.handler||function(t,e,i){i(e)},this._build=t.build||!1};Loader.prototype.options={ext:"js"},Loader.prototype.prefilter=function(t){var e=this;return u.each(this._filters,function(i){var n=z.filter(i);n&&(t=n.call(e,t))}),t},Loader.prototype.method=function(t){return this._method=t,this},Loader.prototype.filters=function(t){return t?u.isArray(t)?void this._filters.concat(t):(this._filters.push(t),this):void 0},Loader.prototype.handler=function(t){return t?(this._handler=t,this):this},Loader.prototype.build=function(t){return t?(this._build=t,this):this},Loader.prototype.has=function(t){return this._queue.hasOwnProperty(t)},Loader.prototype.load=function(t,e,i){var n=this;return t=this.prefilter(t),this.has(t.src)||(this._queue[t.src]=new this._method(t)),this._queue[t.src].done(function(r){n._handler(t,r,e,i),"browser"!==z.config.env&&n._build&&z.loader.build(t,r,n)},i),this};var _loaders={};z.loader=function(t,e){return arguments.length<=1&&_loaders.hasOwnProperty(t)?_loaders[t]:(_loaders[t]=new Loader(e),_loaders[t])},z.loader.build=function(){},_filters={},z.filter=function(t,e){return arguments.length<=1?_filters.hasOwnProperty(t)?_filters[t]:!1:(_filters[t]=e,_filters[t])},z.loader("script",{method:z.Script,filters:["default.src"],handler:function(t,e,i){z.ensureModule(t.from),i()},options:{ext:"js"}}),z.loader("ajax",{method:z.Ajax,filters:["default.src","ajax.method"],handler:function(t,e,i,n){z(t.from,function(){return e}).done(i,n)},options:{ext:"js",method:"GET"}}),z.filter("default.src",function(t){if(t.src)return t;var e=z.config.shim,i=z.config.alias,n=t.from,r=t.options.ext||this.options.ext,o=n.split("."),s="";return u.each(o,function(t,e){i.hasOwnProperty(t)&&(o[e]=i[t])}),n=o.join("."),e.hasOwnProperty(n)?s=e[n].src:(s=n.replace(/\./g,"/"),s=z.config.root+s+"."+r),t.src=s,t}),z.filter("ajax.method",function(t){return t.method=t.method||this.options.method,t});var MODULE_STATE={PENDING:0,LOADED:1,ENABLED:2,FAILED:-1},Module=function(t){this._deps=t&&u.isArray(t)?t:[],this._state=MODULE_STATE.PENDING,this._factory=null,this._definition=null,this._onReady=[],this._onFailed=[]},_alias=/\s?([\S]+?)\s?\@\s?([\S]+?)\s?$/;Module.prototype.use=function(t){if(!this.isEnabled())return!1;var e=this,i=!1,n={};return t?(u.isArray(t)||(i=!0,t=[t]),u.each(t,function(t){var r=t,o=t;_alias.test(t)&&t.replace(_alias,function(t,e,i){return o=e,r=i,t}),e._definition.hasOwnProperty(o)&&(i?n=e._definition[o]:n[r]=e._definition[o])}),n):this._definition},Module.prototype.imports=function(t,e,i){this._state=MODULE_STATE.PENDING;var n=!1;if(_alias.test(t)){var r=t;r.replace(_alias,function(e,i,r){t=i.trim(),n=r.trim()})}e=e&&"*"!==e?u.isArray(e)?e:[e]:!1,i=u.defaults({type:"script"},i);var o={from:t,alias:n,uses:e,options:i};return this._deps.push(o),this},Module.prototype.exports=function(t,e){arguments.length<=1&&(e=t,t=!1);var i=this;return t?(null===this._factory&&(this._factory={}),this._factory[t]=e):this._factory=e,setTimeout(function(){i.enable()},0),this},Module.prototype.enable=function(t,e){return this.done(t,e),this.isPending()?(_import.call(this),this):this.isLoaded()?(_define.call(this),this):this.isFailed()?(_dispatch.call(this,this._onFailed,this),this._onFailed=[],this):(this.isEnabled()&&(_dispatch.call(this,this._onReady,this),this._onReady=[]),this)},Module.prototype.disable=function(){return this.isFailed(!0),this.enable()},Module.prototype.done=function(t,e){return t&&u.isFunction(t)&&(this.isEnabled()?t.call(this):this._onReady.push(t)),e&&u.isFunction(e)&&(this.isFailed()?e.call(this):this._onFailed.push(e)),this},Module.prototype.fail=function(t){return this.done(undef,t)},u.each(["Enabled","Loaded","Pending","Failed"],function(t){var e=MODULE_STATE[t.toUpperCase()];Module.prototype["is"+t]=function(t){return t&&(this._state=e),this._state===e}});var _dispatch=function(t,e){u.each(t,function(t){t.call(e)})},_import=function(){var t=[],e=this;u.each(this._deps,function(e){!1===z.has(e.from)&&t.push(e)});var i=t.length;i>0?u.each(t,function(t){var n=t.options.type||"script",r=z.loader(n);r.load(t,function(){i-=1,0>=i&&(e.isLoaded(!0),e.enable())},function(t){throw e.disable(),t})}):(this.isLoaded(!0),this.enable())},_define=function(){var t={},e=this;if(u.each(this._deps,function(i){if(t){if(!z.has(i.from))throw new Error("A dependency is not in the registry: "+i.from);var n=z(i.from),r={};if(n.isFailed())throw e.disable(),new Error("A dependency failed: "+i.from);if(!n.isEnabled())return n.enable().done(function(){e.enable()}),t=!1,!0;i.uses?r=n.use(i.uses):i.alias?r[i.alias]=n._definition:r[i.from.split(".").pop()]=n._definition,t=u.extend(t,r)}}),t){try{"server"!==z.config.env?u.isFunction(this._factory)?this._definition=this._factory(t):u.isObject(this._factory)?(this._definition={},u.each(this._factory,function(i,n){e._definition[n]=u.isFunction(i)?i(t):i})):this._definition=this._factory:this._definition=!0}catch(i){throw this.disable(),i}this.isEnabled(!0),this.enable()}};root.define=function(t,e,i){2===arguments.length&&(i=e,e=t,t=void 0),1===arguments.length&&(i=t,e=[],t=void 0);var n=z(t);u.each(e,function(t){n.imports(t.split("/").join("."))}),n.exports(function(t){var e=[];for(var n in t)e.push(t[n]);var r,o=root.exports,s=root.module;return root.exports={},root.module={},r=i.apply(this,e),!1===u.isEmpty(root.exports)&&(r=root.exports),root.module.exports&&(r=root.module.exports),root.exports=o,root.module=s,r})},root.define.amd={jQuery:!0};/* modules */

/*main*/
z.setup({
  root: '',
  shim: {},
  alias: {
    'fud': 'test.src'
  }
});

z('main').
imports('fud.bar','*').
exports(function(__){
  
  document.write(__.bar.bar);

  var fud = __.bar;

  return {
    fud: fud
  };

});

/*fud.foo*/
z('fud.foo', function(__){
  
  var foo = 'foo';

  return {
    foo: foo
  };

});

/*fud.bin*/
var Bin = z('fud.bin')
  .imports('fud.foob', 'foob')
  .imports('fud.txt.test', '*', {type:'ajax', ext:'txt'});

Bin.exports(function(__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

});

/*fud.foob*/
z('fud.foob', function(__){
  
  var foob = 'foob';

  return {
    foob: foob
  };

});

/*fud.txt.test*/
z('fud.txt.test').exports(function(){ return 'test'; });



})(window);