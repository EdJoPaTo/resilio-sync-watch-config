const os = require('os');

module.exports = function(jsonConfig) {
  const basedir = jsonConfig.basedir[jsonConfig.basedir.length - 1] === '/' ? jsonConfig.basedir : jsonConfig.basedir + '/';


  const resilioConfig = {};
  resilioConfig.device_name = os.hostname();
  resilioConfig.storage_path = basedir + '.sync';

  const foldernames = Object.keys(jsonConfig.folders);
  resilioConfig.shared_folders = foldernames.map(name => ({
    dir: basedir + name,
    secret: jsonConfig.folders[name]
  }));

  if (jsonConfig.passthrough) {
    const passthroughKeys = Object.keys(jsonConfig.passthrough);
    for (const key of passthroughKeys) {
      resilioConfig[key] = jsonConfig.passthrough[key];
    }
  }

  return resilioConfig;
};
