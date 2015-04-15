// Export the default instance. If the global object `Z_CONFIG`
// exists it will be used to setup the instance.
if (!root.z) {
  var usrConfig = (root.Z_CONFIG || {});
  root.z = new Z(usrConfig, new Loader());
  // Helper to create a new instance of Z.
  root.z.createScope = function (config, loader) {
    return new Z(config, loader);
  };
  // Allow users to leave the 'z.' off module declarations.
  if (!usrConfig.dontCreateModuleShortcut) 
    root.module = root.z.module.bind(root.z);
  root.z.autostart();
}

}));