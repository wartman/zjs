/*test.src.main*/
(function(root){

/*! zjs */
var u=function(t){return t instanceof u?t:this instanceof u?(this._chain=!0,void(this._obj=t)):new u(t)},ArrayProto=Array.prototype,ObjProto=Object.prototype,FuncProto=Function.prototype,undef,push=ArrayProto.push,slice=ArrayProto.slice,concat=ArrayProto.concat,toString=ObjProto.toString,hasOwnProperty=ObjProto.hasOwnProperty,nativeForEach=ArrayProto.forEach,nativeMap=ArrayProto.map,nativeReduce=ArrayProto.reduce,nativeReduceRight=ArrayProto.reduceRight,nativeFilter=ArrayProto.filter,nativeEvery=ArrayProto.every,nativeSome=ArrayProto.some,nativeIndexOf=ArrayProto.indexOf,nativeLastIndexOf=ArrayProto.lastIndexOf,nativeKeys=Object.keys;u._idIndex=0,u.uniqueId=function(t){return u._idIndex++,t+u._idIndex},u.isArray=Array.isArray||function(){return"[object Array]"==toString.call(obj)},u.each=function(t,n,e){if(null===t)return t;if(e=e||t,nativeForEach&&t.forEach)t.forEach(n);else if(u.isArray(t))for(var r=0;r<t.length&&(!t[r]||!n.call(e,t[r],r,t));r+=1);else for(var i in t)if(t.hasOwnProperty(i)&&i&&n.call(e,t[i],i,t))break;return t},u.eachReverse=function(t,n,e){if(t){var r;for(r=t.length-1;r>-1&&(!t[r]||!n.call(e,t[r],r,t));r-=1);}return t},u.each(["Arguments","Function","String","Number","Date","RegExp"],function(t){u["is"+t]=function(n){return toString.call(n)=="[object "+t+"]"}}),u.isUndefined=function(t){return void 0===t},u.isObject=function(t){return t===Object(t)},u.extend=function(t){return u.each(slice.call(arguments,1),function(n){if(n)for(var e in n)t[e]=n[e]}),t},u.clone=function(t){return null===t||!1===u.isObject(t)?t:u.isArray(t)?t.slice():u.extend({},t)},u.keys=function(t){if(!u.isObject(t))return[];if(nativeKeys)return nativeKeys(t);var n=[];for(var e in t)n.push(e);return n},u.values=function(t){for(var n=[],e=u.keys(t),r=e.length,i=0;r>i;i+=1)n[i]=t(e[i]);return n},u.defaults=function(t,n){var e=u.clone(t);if(void 0===n)return e;for(var r in e)e.hasOwnProperty(r)&&!n.hasOwnProperty(r)&&(n[r]=e[r]);return n},u.extract=function(t,n,e){return e=e||{},u.each(t,function(t){n.hasOwnProperty(t)&&(e[t]=e.hasOwnProperty(t)&&u.isObject(e[t])?u.extend(e[t],n[t]):n[t],delete n[t])}),e},u.once=function(t,n){var e,r=!1;return n=n||this,function(){return r?e:(r=!0,e=t.apply(n,arguments),t=null,e)}},u.isEmpty=function(t){if(null==t)return!0;if(t instanceof Array||t instanceof String)return 0===t.length;for(var n in t)if(t.hasOwnProperty(n))return!1;return!0},u.chain=function(t){return u(t).chain()},u.isNumeric=function(t){return t-parseFloat(t)>=0};var uResult=function(t){return this._chain?u(t).chain():t};u.each(u,function(t,n){u.isFunction(t)&&(u.prototype[n]=function(){var n=[this._obj];return push.apply(n,arguments),uResult.call(this,t.apply(u,n))})}),u.prototype.chain=function(){return this._chain=!0,this},u.prototype.value=function(){return this._obj};var z=root.z=function(t,n){if(z.has(t)&&!n)return z.modules[t];u.isFunction(t)&&(n=t,t=undef);var e=_add(t);return n&&e.exports(n),e},_add=function(t){if("undefined"==typeof t){var n;if(!Script.useInteractive)return z.tmp=new Module,z.tmp;n=Script.currentlyAddingScript||Script.getInteractiveScript(),t=n.getAttribute("data-from")}return z.modules[t]=new Module,z.modules[t]};z.u=z.util=u,z.modules={},z.plugins={},z.tmp=null,z.has=function(t){return z.modules.hasOwnProperty(t)},z.config={root:"",shim:{},alias:{},env:"browser"},z.setup=function(t){z.config=u.defaults(z.config,t)},z.ensureModule=function(t){var n=z.tmp;null!==n&&(z.tmp=null,!n instanceof Module||(z.modules[t]=n))},z.script=function(t,n,e){var r=new Script(t,z.config.script).ready(n,e);return r},z.script.isPending=function(t){return Script.isPending(t)},z.ajax=function(t,n,e){var r=new Ajax(t,z.config.ajax);return r.ready(n,e),r},z.plugin=function(t,n){if(!n){if(z.plugins.hasOwnProperty(t))return z.plugins[t];throw new Error("Plugin was not found: "+t)}if(!u.isFunction(n))throw new TypeError("[plugin] must be a function or undefined: "+typeof n);return z.plugins[t]=n,z.plugins[t]},root.imports=function(t,n,e){return z().imports(t,n,e)};var fnTest=/xyz/.test(function(){})?/\b__super__\b/:/[\D|\d]*/,_classExtend=function(t){var n=this.prototype,e=this,r=u.isFunction(t.__new__)?function(){var n=t.__new__;return delete t.__new__,n}():function(){e.apply(this,arguments)},i=function(){this.constructor=r};i.prototype=this.prototype,r.prototype=new i;for(var o in t)r.prototype[o]=u.isFunction(t[o])&&u.isFunction(n[o])&&fnTest.test(t[o])?function(t,e){return function(){var r=this.__super__;this.__super__=n[t];var i=e.apply(this,arguments);return this.__super__=r,i}}(o,t[o]):t[o];return r.prototype.constructor=r,r.extend=arguments.callee,r},_classConstructor=function(){this.__init__&&this.__init__.apply(this,arguments)};z.Class=function(t,n){if(n||(n=t,t=!1),!t)return _classExtend.call(_classConstructor,n);if(t&&hasOwnProperty.call(t,"extend"))return t.extend(n);if(z.util.isFunction(t))return _classExtend.call(t,n);if(z.util.isObject(t))return t.__new__=_classConstructor,_classExtend.call(t,n);throw new TypeError("{parent} must be a function, object or undefined.")};var MODULE_STATE={PENDING:0,LOADED:1,ENABLED:2,FAILED:-1},Module=function(t){this._deps=t&&u.isArray(t)?t:[],this._state=MODULE_STATE.PENDING,this._factory=null,this._definition=null,this._onReady=[],this._onFailed=[]};Module.prototype.use=function(t){if(!this.isEnabled())return!1;var n=this,e=!1,r={};return t?(u.isArray(t)||(e=!0,t=[t]),u.each(t,function(t){var i=t,o=t;_alias.test(t)&&t.replace(_alias,function(t,n,e){return o=n.trim(),i=e.trim(),t}),n._definition.hasOwnProperty(o)&&(e?r=n._definition[o]:r[i]=n._definition[o])}),r):this._definition},Module.prototype.imports=function(t,n,e){if(!t)throw new TypeError("{from} must be defined");var r=!1;if(_alias.test(t)){var i=t;i.replace(_alias,function(n,e,i){t=e.trim(),r=i.trim()})}n=n&&"*"!==n?u.isArray(n)?n:[n]:!1,e=u.defaults({type:"script"},e);var o={from:t,alias:r,uses:n,options:e};return o.url=_findUrl(o),this._deps.push(o),this},Module.prototype.exports=function(t,n){arguments.length<=1&&(n=t,t=!1);var e=this;return t?(null===this._factory&&(this._factory={}),this._factory[t]=n):this._factory=n,setTimeout(function(){_resolve(e)},0),this},Module.prototype.enable=function(t,n){return this.ready(t,n),_resolve(this),this},Module.prototype.ready=function(t,n){return t&&u.isFunction(t)&&(this.isEnabled()?t.call(this):this._onReady.push(t)),n&&u.isFunction(n)&&(this.isFailed()?n.call(this):this._onFailed.push(n)),this},Module.prototype.fail=function(t){return this.ready(undef,t)},u.each(["Enabled","Loaded","Pending","Failed"],function(t){Module.prototype["is"+t]=function(){return this._state===MODULE_STATE[t.toUpperCase()]}});var _alias=/([\s\S]+?)\@([\s\S]+?)$/g,_dispatch=function(t,n){u.each(t,function(t){t.call(n)})},_resolve=function(t,n){return n&&(t._state=n),t.isPending()?void _import(t):t.isLoaded()?void _define(t):t.isFailed()?(_dispatch(t._onFailed,t),void(t._onFailed=[])):void(t.isEnabled()&&(_dispatch(t._onReady,t),t._onReady=[]))},_import=function(t){var n=[];u.each(t._deps,function(t){!1===z.has(t.from)&&n.push(t)});var e=n.length;e>0?u.each(n,function(n){try{var r=n.options.type||"script",i=z.plugin(r);i(n,function(){e-=1,0>=e&&_resolve(t,MODULE_STATE.LOADED)},function(n){throw _resolve(t,MODULE_STATE.FAILED),n})}catch(o){throw _resolve(t,MODULE_STATE.FAILED),o}}):_resolve(t,MODULE_STATE.LOADED)},_define=function(t){var n=!1,e={};if(u.each(t._deps,function(r){!z.has(r);var i=z(r.from),o={};if(i.isFailed())throw _resolve(t,MODULE_STATE.FAILED),new Error("A depenency failed: "+i);return i.isEnabled()?(r.uses?o=i.use(r.uses):r.alias?o[r.alias]=i._definition:o[r.from.split(".").pop()]=i._definition,void(e=u.extend(e,o))):(i.enable().ready(function(){t.enable()}),n=!0,!0)}),!0!==n){try{"server"!==z.config.env?u.isFunction(t._factory)?t._definition=t._factory(e):u.isObject(t._factory)?(t._definition={},u.each(t._factory,function(n,r){t._definition[r]=u.isFunction(n)?n(e):n})):t._definition=t._factory:t._definition=!0}catch(r){throw _resolve(t,MODULE_STATE.FAILED),r}_resolve(t,MODULE_STATE.ENABLED)}};_findUrl=function(t){var n=z.config.shim,e=z.config.alias,r=t.from,i=t.options.ext||"js",o=r.split("."),s="";return u.each(o,function(t,n){e.hasOwnProperty(t)&&(o[n]=e[t])}),r=o.join("."),n.hasOwnProperty(r)?s=n[r].src:(s=r.replace(/\./g,"/"),s=z.config.root+s+"."+i),s},LOADER_STATE={PENDING:0,DONE:1,FAILED:-1};var Loader=z.Class({__new__:function(t,n){this.options=u.defaults(this.options,n),this.node=!1,this._state=LOADER_STATE.PENDING,this._onReady=[],this._onFailed=[],this._value=!1,this.__init__.apply(this,arguments),this.load(t)},__init__:function(){},load:function(){},ready:function(t,n){t&&u.isFunction(t)&&(this.isDone()?t(this._value):this._onReady.push(t)),n&&u.isFunction(n)&&(this.isFailed()?n(this._value):this._onFailed.push(n))},_resolve:function(t,n){n&&(this._state=n);var e=this;return this.isDone()?(u.each(e._onReady,function(n){n(t)}),void(this._onReady=[])):this.isFailed()?(u.each(e._onFailed,function(n){n(t)}),void(this._onFailed=[])):void 0}});u.each(["Done","Pending","Failed"],function(t){Loader.prototype["is"+t]=function(){return this._state===LOADER_STATE[t.toUpperCase()]}});var Script=Loader.extend({options:{nodeType:"text/javascript",charset:"utf-8",async:!0},__init__:function(){Script.scripts.push(this)},create:function(){var t=this._value=document.createElement("script");return t.type=this.options.nodeType||"text/javascript",t.charset=this.options.charset,t.async=this.options.async,t},load:function(t){var n=this.create(),e=document.getElementsByTagName("head")[0],r=this,i=(this.scriptSettings,{url:""});t=u.defaults(i,t),n.setAttribute("data-from",t.from||t.url),Script.pending.push(t.url),_scriptLoadEvent(n,function(t){r._resolve(t,LOADER_STATE.DONE)},function(t){r._resolve(t,LOADER_STATE.FAILED)}),this.currentlyAddingScript=n,n.src=t.url,e.appendChild(n),this.currentlyAddingScript=null}});Script.pending=[],Script.isPending=function(t){return Script.pending.indexOf(t)>=0},Script.currentlyAddingScript=null,Script.interactiveScript=null,Script.getInteractiveScript=function(){return Script.interactiveScript&&"interactive"===Script.interactiveScript.readyState?interactiveScript:(u.eachReverse(Script.scripts(),function(t){return"interactive"===t.readyState?self.interactiveScript=t:void 0}),interactiveScript)},Script.scripts=[],Script.getScripts=function(){return Script.scripts};var _scriptLoadEvent=function(){if("undefined"==typeof document)return function(){};var t=document.createElement("script"),n=null;return n=t.attachEvent?function(t,n){Script.useInteractive=!0,t.attachEvent("onreadystatechange",function(){"loaded"===t.readyState&&(n(t),Script.interactiveScript=null)})}:function(t,n,e){t.addEventListener("load",function(){n(t),Script.interactiveScript=null},!1),t.addEventListener("error",function(t){e(t),Script.interactiveScript=null},!1)}}(),AJAX_STATE={PENDING:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4,FAILED:-1},HTTP_METHODS=["GET","PUT","POST","DELETE"],Ajax=Loader.extend({options:{defaults:{url:"",method:"GET",data:!1}},load:function(t){var n,e=this,r="GET";if(t=u.defaults(this.options.defaults,t),r="GET"===t.method.toUpperCase(),HTTP_METHODS.indexOf(r)<=0&&(r="GET"),n=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),n.onreadystatechange=function(){AJAX_STATE.DONE===this.readyState&&(200===this.status?(e._value=this.response?this.response:this.responseText,e._resolve(e._value,AJAX_STATE.DONE)):(e._value=this.status,e._resolve(this.status,AJAX_STATE.FAILED)))},"GET"===r&&t.data&&(t.url+="?"+this._buildQueryStr(t.data)),n.open(r,t.url,!0),"POST"===r&&t.data){var i=this._buildQueryStr(t.data);n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.send(i)}else n.send()},_buildQueryStr:function(t){var n=[];for(var e in t)n.push(e+"="+t[e]);return n.join("&")}});u.each(["Done","Pending","Failed"],function(t){Ajax.prototype["is"+t]=function(){return this._state===AJAX_STATE[t.toUpperCase()]}}),root.define=function(t,n,e){2===arguments.length&&(e=n,n=t,t=void 0),1===arguments.length&&(e=t,n=[],t=void 0);var r=z(t);u.each(n,function(t){r.imports(t.split("/").join("."))}),r.exports(function(t){var n=[];for(var r in t)n.push(t[r]);var i,o=root.exports,s=root.module;return root.exports={},root.module={},i=e.apply(this,n),!1===u.isEmpty(root.exports)&&(i=root.exports),root.module.exports&&(i=root.module.exports),root.exports=o,root.module=s,i})},root.define.amd={jQuery:!0},z.plugin("script",function(t,n,e){var r=t.from;z.script.isPending(t.url)||z.script(t,function(){z.ensureModule(r),n()},e)}),z.plugin("ajax",function(t,n,e){var r=t.from,i=z(r);t.method="GET",z.ajax(t,function(t){i.exports(function(){return t}),n()},e)});z.setup({"root":"","shim":{},"alias":{"fud":"test.src"}});

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

  var testClass = fit.Class.create({
    
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