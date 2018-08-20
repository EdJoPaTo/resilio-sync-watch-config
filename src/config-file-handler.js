const childProcess = require('child_process')
const fs = require('fs')
const util = require('util')

const exec = util.promisify(childProcess.exec)
const fsPromises = fs.promises

const debounce = require('./debounce')
const parseConfig = require('./parse-config')
const {mergeMultipleConfigs} = require('./merge-multiple-configs')

function log(...args) {
  console.log(new Date(), 'Config File', ...args)
}

async function loadFromFile(filepath) {
  const content = await fsPromises.readFile(filepath, 'utf8')
  return JSON.parse(content)
}

function saveToFile(filepath, json) {
  const content = JSON.stringify(json, null, 2)
  return fsPromises.writeFile(filepath, content, 'utf8')
}

function createFolderInFS(folderpath) {
  return exec(`mkdir -p ${folderpath}`)
}

function watchFile(file, onChangeCallback) {
  fs.watch(file, {persistent: false}, debounce(curr => {
    log(file, 'changed')
    onChangeCallback(file, curr)
  }, 500))
}

class ConfigFileHandler {
  constructor(configFiles, resilioConfigFilePath) {
    this.configFiles = configFiles
    this.resilioConfigFilePath = resilioConfigFilePath
  }

  log(...args) {
    log(...args)
  }

  async generateResilioConfig(createFoldersOnFS = true, saveToFS = false) {
    log('load configs…')
    const configs = await Promise.all(this.configFiles.map(file =>
      loadFromFile(file)
    ))
    const mergedConfig = mergeMultipleConfigs(...configs)
    log('generate config…')
    const resilioConfig = parseConfig(mergedConfig)
    if (createFoldersOnFS) {
      log('create storage_path in filesystem…', resilioConfig.storage_path)
      await createFolderInFS(resilioConfig.storage_path)
    }
    if (saveToFS) {
      log('save resilio config…', this.resilioConfigFilePath)
      await saveToFile(this.resilioConfigFilePath, resilioConfig)
    }
    log('successfully generated config')
    return resilioConfig
  }

  watch(onChangeCallback) {
    log('start watching…')
    this.configFiles.forEach(file => watchFile(file, onChangeCallback))
  }
}

module.exports = ConfigFileHandler
