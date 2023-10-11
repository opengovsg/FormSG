/* eslint-disable @typescript-eslint/no-explicit-any */
type FormPluginData = {
  name: string
  data: any
}

class FormPluginDataStore {
  pluginData: Record<string, any>

  constructor() {
    this.pluginData = {}
  }

  addPlugin(plugin: FormPluginData) {
    this.pluginData[plugin.name] = plugin.data
  }

  getPluginData(name: string) {
    return this.pluginData[name]
  }

  updatePluginData(name: string, data: any) {
    this.pluginData[name] = data
  }
}

const formPluginDataStore = new FormPluginDataStore()

export default formPluginDataStore
