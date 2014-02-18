
  if(typeof window !== "undefined"){  
    // Get the current script
    var executingScript = document.getElementsByTagName('script')[0]
    // Get a script to load from the DOM (set using data-load="script")
      , scriptToLoad = executingScript.getAttribute('data-load')
      ;

    // Start z once the DOM is ready.
    z.boot(function(e){

      if(null !== scriptToLoad && scriptToLoad.length > 0){ // getAttribute can return null OR empty string
        var scriptRootParts = scriptToLoad.replace(/\./, '/').split('/')
          , alias = (scriptRootParts.length >=1)? scriptRootParts.pop() : scriptToLoad
          , scriptRoot = ""
          ;

        if(scriptRootParts.length > 0){
          // Set the root based on the included file.
          // For example, including 'scripts/main' will result in 'scripts/' being the root.
          scriptRoot = scriptRootParts.join('/') + '/';
          z.config.module.root = scriptRoot;
        }

        // Ensure the requested script is loaded.
        var req = {from: alias};
        req.url = z.module.findUrl(req);
        z.Scripts.load(req, function(req, res){
          z.module.start();
        });

        return;
      }

      // Start collecting and defining modules.
      z.module.start();
    });
  }

}));