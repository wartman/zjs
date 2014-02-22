/*test.src.main*/
(function(root){

/*! zjs */
var u=function(t){return t instanceof u?t:this instanceof u?(this._chain=!0,void(this._obj=t)):new u(t)},ArrayProto=Array.prototype,ObjProto=Object.prototype,FuncProto=Function.prototype,undef,push=ArrayProto.push,slice=ArrayProto.slice,concat=ArrayProto.concat,toString=ObjProto.toString,hasOwnProperty=ObjProto.hasOwnProperty,nativeForEach=ArrayProto.forEach,nativeMap=ArrayProto.map,nativeReduce=ArrayProto.reduce,nativeReduceRight=ArrayProto.reduceRight,nativeFilter=ArrayProto.filter,nativeEvery=ArrayProto.every,nativeSome=ArrayProto.some,nativeIndexOf=ArrayProto.indexOf,nativeLastIndexOf=ArrayProto.lastIndexOf,nativeKeys=Object.keys;u._idIndex=0,u.uniqueId=function(t){return u._idIndex++,t+u._idIndex},u.isArray=Array.isArray||function(){return"[object Array]"==toString.call(obj)},u.each=function(t,e,n){if(null===t)return t;if(n=n||t,nativeForEach&&t.forEach)t.forEach(e);else if(u.isArray(t))for(var r=0;r<t.length&&(!t[r]||!e.call(n,t[r],r,t));r+=1);else for(var i in t)if(t.hasOwnProperty(i)&&i&&e.call(n,t[i],i,t))break;return t},u.eachReverse=function(t,e,n){if(t){var r;for(r=t.length-1;r>-1&&(!t[r]||!e.call(n,t[r],r,t));r-=1);}return t},u.each(["Arguments","Function","String","Number","Date","RegExp"],function(t){u["is"+t]=function(e){return toString.call(e)=="[object "+t+"]"}}),u.isUndefined=function(t){return void 0===t},u.isObject=function(t){return t===Object(t)},u.extend=function(t){return u.each(slice.call(arguments,1),function(e){if(e)for(var n in e)t[n]=e[n]}),t},u.clone=function(t){return null===t||!1===u.isObject(t)?t:u.isArray(t)?t.slice():u.extend({},t)},u.keys=function(t){if(!u.isObject(t))return[];if(nativeKeys)return nativeKeys(t);var e=[];for(var n in t)e.push(n);return e},u.values=function(t){for(var e=[],n=u.keys(t),r=n.length,i=0;r>i;i+=1)e[i]=t(n[i]);return e},u.defaults=function(t,e){var n=u.clone(t);if(void 0===e)return n;for(var r in n)n.hasOwnProperty(r)&&!e.hasOwnProperty(r)&&(e[r]=n[r]);return e},u.extract=function(t,e,n){return n=n||{},u.each(t,function(t){e.hasOwnProperty(t)&&(n[t]=n.hasOwnProperty(t)&&u.isObject(n[t])?u.extend(n[t],e[t]):e[t],delete e[t])}),n},u.once=function(t,e){var n,r=!1;return e=e||this,function(){return r?n:(r=!0,n=t.apply(e,arguments),t=null,n)}},u.isEmpty=function(t){if(null==t)return!0;if(t instanceof Array||t instanceof String)return 0===t.length;for(var e in t)if(t.hasOwnProperty(e))return!1;return!0},u.chain=function(t){return u(t).chain()},u.isNumeric=function(t){return t-parseFloat(t)>=0};var uResult=function(t){return this._chain?u(t).chain():t};u.each(u,function(t,e){u.isFunction(t)&&(u.prototype[e]=function(){var e=[this._obj];return push.apply(e,arguments),uResult.call(this,t.apply(u,e))})}),u.prototype.chain=function(){return this._chain=!0,this},u.prototype.value=function(){return this._obj};var z=root.z=function(t,e){if(z.has(t)&&!e)return z.modules[t];u.isFunction(t)&&(e=t,t=undef);var n=_addModule(t);return e&&n.exports(e),n},_addModule=function(t){if("undefined"==typeof t){var e;if(!Script.useInteractive)return z.tmp=new Module,z.tmp;e=Script.currentlyAddingScript||Script.getInteractiveScript(),t=e.getAttribute("data-from")}return z.modules[t]=new Module,z.modules[t]};z.modules={},z.tmp=null,z.has=function(t){return z.modules.hasOwnProperty(t)},z.ensureModule=function(t){var e=z.tmp;null!==e&&(z.tmp=null,!e instanceof Module||(z.modules[t]=e))},z.config={root:"",shim:{},alias:{},env:"browser"},z.setup=function(t){z.config=u.defaults(z.config,t)},z.u=z.util=u,z.plugins={},z.plugin=function(t,e,n,r){if(arguments.length<=1){if(z.plugins.hasOwnProperty(t))return z.plugins[t];throw new Error("Plugin was not found: "+t)}return z.plugins[t]=new Plugable(e,n,r),z.plugins[t]},z.script=function(t,e,n){var r=new Script(t,z.config.script);return r.ready(e,n),r},z.ajax=function(t,e,n){var r=new Ajax(t,z.config.ajax);return r.ready(e,n),r};var fnTest=/xyz/.test(function(){})?/\b__super__\b/:/[\D|\d]*/,_classExtend=function(t){var e=this.prototype,n=this,r=u.isFunction(t.__new__)?function(){var e=t.__new__;return delete t.__new__,e}():function(){n.apply(this,arguments)},i=function(){this.constructor=r};i.prototype=this.prototype,r.prototype=new i;for(var o in t)r.prototype[o]=u.isFunction(t[o])&&u.isFunction(e[o])&&fnTest.test(t[o])?function(t,n){return function(){var r=this.__super__;this.__super__=e[t];var i=n.apply(this,arguments);return this.__super__=r,i}}(o,t[o]):t[o];return r.prototype.constructor=r,r.extend=arguments.callee,r},_classConstructor=function(){this.__init__&&this.__init__.apply(this,arguments)};z.Class=function(t,e){if(e||(e=t,t=!1),!t)return _classExtend.call(_classConstructor,e);if(t&&hasOwnProperty.call(t,"extend"))return t.extend(e);if(z.util.isFunction(t))return _classExtend.call(t,e);if(z.util.isObject(t))return t.__new__=_classConstructor,_classExtend.call(t,e);throw new TypeError("{parent} must be a function, object or undefined.")};var MODULE_STATE={PENDING:0,LOADED:1,ENABLED:2,FAILED:-1},Module=function(t){this._deps=t&&u.isArray(t)?t:[],this._state=MODULE_STATE.PENDING,this._factory=null,this._definition=null,this._onReady=[],this._onFailed=[]},_alias=/\s?([\S]+?)\s?\@\s?([\S]+?)\s?$/;Module.prototype.use=function(t){if(!this.isEnabled())return!1;var e=this,n=!1,r={};return t?(u.isArray(t)||(n=!0,t=[t]),u.each(t,function(t){var i=t,o=t;_alias.test(t)&&t.replace(_alias,function(t,e,n){return o=e,i=n,t}),e._definition.hasOwnProperty(o)&&(n?r=e._definition[o]:r[i]=e._definition[o])}),r):this._definition},Module.prototype.imports=function(t,e,n){if(!t)throw new TypeError("{from} must be defined");var r=!1;if(_alias.test(t)){var i=t;i.replace(_alias,function(e,n,i){t=n.trim(),r=i.trim()})}e=e&&"*"!==e?u.isArray(e)?e:[e]:!1,n=u.defaults({type:"script"},n);var o={from:t,alias:r,uses:e,options:n};return this._deps.push(o),this},Module.prototype.exports=function(t,e){arguments.length<=1&&(e=t,t=!1);var n=this;return t?(null===this._factory&&(this._factory={}),this._factory[t]=e):this._factory=e,setTimeout(function(){_resolve(n)},0),this},Module.prototype.enable=function(t,e){return this.done(t,e),_resolve(this),this},Module.prototype.done=function(t,e){return t&&u.isFunction(t)&&(this.isEnabled()?t.call(this):this._onReady.push(t)),e&&u.isFunction(e)&&(this.isFailed()?e.call(this):this._onFailed.push(e)),this},Module.prototype.fail=function(t){return this.done(undef,t)},u.each(["Enabled","Loaded","Pending","Failed"],function(t){Module.prototype["is"+t]=function(){return this._state===MODULE_STATE[t.toUpperCase()]}});var _dispatch=function(t,e){u.each(t,function(t){t.call(e)})},_resolve=function(t,e){return e&&(t._state=e),t.isPending()?void _import(t):t.isLoaded()?void _define(t):t.isFailed()?(_dispatch(t._onFailed,t),void(t._onFailed=[])):void(t.isEnabled()&&(_dispatch(t._onReady,t),t._onReady=[]))},_import=function(t){var e=[];u.each(t._deps,function(t){!1===z.has(t.from)&&e.push(t)});var n=e.length;n>0?u.each(e,function(e){try{var r=e.options.type||"script",i=z.plugin(r);i.load(e,function(){n-=1,0>=n&&_resolve(t,MODULE_STATE.LOADED)},function(e){throw _resolve(t,MODULE_STATE.FAILED),e})}catch(o){throw _resolve(t,MODULE_STATE.FAILED),o}}):_resolve(t,MODULE_STATE.LOADED)},_define=function(t){var e=!1,n={};if(u.each(t._deps,function(r){!z.has(r);var i=z(r.from),o={};if(i.isFailed())throw _resolve(t,MODULE_STATE.FAILED),new Error("A depenency failed: "+i);return i.isEnabled()?(r.uses?o=i.use(r.uses):r.alias?o[r.alias]=i._definition:o[r.from.split(".").pop()]=i._definition,void(n=u.extend(n,o))):(i.enable().done(function(){t.enable()}),e=!0,!0)}),!0!==e){try{"server"!==z.config.env?u.isFunction(t._factory)?t._definition=t._factory(n):u.isObject(t._factory)?(t._definition={},u.each(t._factory,function(e,r){t._definition[r]=u.isFunction(e)?e(n):e})):t._definition=t._factory:t._definition=!0}catch(r){throw _resolve(t,MODULE_STATE.FAILED),r}_resolve(t,MODULE_STATE.ENABLED)}},Plugable=function(t,e,n){this._queue={},this._loader=t,this.options=u.defaults(this.options,n),this._loadEvent=e};Plugable.prototype.options={ext:"js"},Plugable.prototype._makeUrl=function(t){var e=z.config.shim,n=z.config.alias,r=t.from,i=t.options.ext||this.options.ext,o=r.split("."),s="";return u.each(o,function(t,e){n.hasOwnProperty(t)&&(o[e]=n[t])}),r=o.join("."),e.hasOwnProperty(r)?s=e[r].src:(s=r.replace(/\./g,"/"),s=z.config.root+s+"."+i),s},Plugable.prototype.enqueue=function(t,e){this._queue[t]=e},Plugable.prototype.has=function(t){return this._queue.hasOwnProperty(t)},Plugable.prototype.load=function(t,e,n){var r=this;t.url||(t.url=this._makeUrl(t)),this.options.req&&(t=u.defaults(this.options.req,t)),this.has(t.url)||this.enqueue(t.url,new this._loader(t)),this._queue[t.url].done(function(i){r._loadEvent(t,i,e,n)},n)},LOADER_STATE={PENDING:0,DONE:1,FAILED:-1};var Loader=z.Loader=z.Class({__new__:function(t,e){this.options=u.defaults(this.options,e),this.node=!1,this._state=LOADER_STATE.PENDING,this._onReady=[],this._onFailed=[],this._value=!1,this.__init__.apply(this,arguments),this.load(t)},__init__:function(){},load:function(){},done:function(t,e){t&&u.isFunction(t)&&(this.isDone()?t(this._value):this._onReady.push(t)),e&&u.isFunction(e)&&(this.isFailed()?e(this._value):this._onFailed.push(e))},_resolve:function(t,e){e&&(this._state=e);var n=this;return this.isDone()?(u.each(n._onReady,function(e){e(t)}),void(this._onReady=[])):this.isFailed()?(u.each(n._onFailed,function(e){e(t)}),void(this._onFailed=[])):void 0}});u.each(["Done","Pending","Failed"],function(t){Loader.prototype["is"+t]=function(){return this._state===LOADER_STATE[t.toUpperCase()]}});var Script=Loader.extend({options:{nodeType:"text/javascript",charset:"utf-8",async:!0},create:function(){var t=this._value=document.createElement("script");return t.type=this.options.nodeType||"text/javascript",t.charset=this.options.charset,t.async=this.options.async,t},load:function(t){var e=this.create(),n=document.getElementsByTagName("head")[0],r=this,i=(this.scriptSettings,{url:""});t=u.defaults(i,t),e.setAttribute("data-from",t.from||t.url),_scriptLoadEvent(e,function(t){r._resolve(t,LOADER_STATE.DONE)},function(t){r._resolve(t,LOADER_STATE.FAILED)}),Script.currentlyAddingScript=e,e.src=t.url,n.appendChild(e),Script.currentlyAddingScript=null}});Script.useInteractive=!1,Script.currentlyAddingScript=null,Script.interactiveScript=null,Script.getInteractiveScript=function(){return console.log("getting interactive"),Script.interactiveScript&&"interactive"===Script.interactiveScript.readyState?Script.interactiveScript:(u.eachReverse(Script.scripts(),function(t){return"interactive"===t.readyState?(Script.interactiveScript=t,!0):void 0}),Script.interactiveScript)},Script.scripts=function(){return document.getElementsByTagName("script")};var _scriptLoadEvent=function(){if("undefined"==typeof document)return function(){};var t=document.createElement("script"),e=null;return t.attachEvent?(console.log("setup interactive"),e=function(t,e){Script.useInteractive=!0,t.attachEvent("onreadystatechange",function(){"complete"===t.readyState&&(e(t),Script.interactiveScript=null)})}):e=function(t,e,n){t.addEventListener("load",function(){e(t)},!1),t.addEventListener("error",function(t){n(t)},!1)},e}(),AJAX_STATE={PENDING:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4,FAILED:-1},HTTP_METHODS=["GET","PUT","POST","DELETE"],Ajax=Loader.extend({options:{defaults:{url:"",method:"GET",data:!1}},load:function(t){this.__super__(t);var e,n=this,r="GET";if(t=u.defaults(this.options.defaults,t),r="GET"===t.method.toUpperCase(),HTTP_METHODS.indexOf(r)<=0&&(r="GET"),e=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),e.onreadystatechange=function(){AJAX_STATE.DONE===this.readyState&&(200===this.status?(console.log(this.responseText),n._value=this.responseText,n._resolve(n._value,AJAX_STATE.DONE)):(n._value=this.status,n._resolve(this.status,AJAX_STATE.FAILED)))},"GET"===r&&t.data&&(t.url+="?"+this._buildQueryStr(t.data)),e.open(r,t.url,!0),"POST"===r&&t.data){var i=this._buildQueryStr(t.data);e.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),e.send(i)}else e.send()},_buildQueryStr:function(t){var e=[];for(var n in t)e.push(n+"="+t[n]);return e.join("&")}});u.each(["Done","Pending","Failed"],function(t){Ajax.prototype["is"+t]=function(){return this._state===AJAX_STATE[t.toUpperCase()]}}),root.define=function(t,e,n){2===arguments.length&&(n=e,e=t,t=void 0),1===arguments.length&&(n=t,e=[],t=void 0);var r=z(t);u.each(e,function(t){r.imports(t.split("/").join("."))}),r.exports(function(t){var e=[];for(var r in t)e.push(t[r]);var i,o=root.exports,s=root.module;return root.exports={},root.module={},i=n.apply(this,e),!1===u.isEmpty(root.exports)&&(i=root.exports),root.module.exports&&(i=root.module.exports),root.exports=o,root.module=s,i})},root.define.amd={jQuery:!0},z.plugin("script",Script,function(t,e,n){var r=t.from;z.ensureModule(r),n()},{ext:"js"}),z.plugin("ajax",Ajax,function(t,e,n,r){var i=t.from;z(i,function(){return e}).done(n,r)},{req:{method:"GET"},ext:"txt"});z.setup({"root":"","shim":{},"alias":{"fud":"test.src"}});

/* modules */
z.modules = {
/*main*/
'main': new Module([
  {"from":"fud.bar","alias":false,"uses":false,"options":{"type":"script"},"url":"test/src/bar.js"}
]).exports(function (__){
  
  var fud = __.bar;

  return {
    fud: fud
  };

}),

/*fud.bar*/
'fud.bar': new Module([
  {"from":"fud.foo","alias":false,"uses":["foo"],"options":{"type":"script"},"url":"test/src/foo.js"},
  {"from":"fud.bin","alias":false,"uses":["bin"],"options":{"type":"script"},"url":"test/src/bin.js"}
]).exports(function (__){
  
  var bar = 'bar' + __.foo;
  var bin = 'bin' + __.bin;

  var testClass = z.Class({
    
    __init__:function(){
      this.foo = 'foo'
    }
  
  });

  return {
    bar: bar,
    testClass: testClass
  };

}),

/*fud.foo*/
'fud.foo': new Module().exports(function (__){
  
  var foo = 'foo';

  return {
    foo: foo
  };

}),

/*fud.bin*/
'fud.bin': new Module([
  {"from":"fud.foob","alias":false,"uses":["foob"],"options":{"type":"script"},"url":"test/src/foob.js"}
]).exports(function (__){
  
  var bin = 'bin' + __.foob;

  return {
    bin: bin
  };

}),

/*fud.foob*/
'fud.foob': new Module().exports(function (__){
  
  var foob = 'foob';

  return {
    foob: foob
  };

}),

};


})(window);