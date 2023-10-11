import { createContext, FC, useState } from 'react'

type FormPlugin = {
  name: string
  description: string
  plugin: any
}

const PluginsContext = createContext<{
  plugins: FormPlugin[]
  addPlugin: (plugin: FormPlugin) => void
}>({
  plugins: [],
  addPlugin: () => undefined,
})

export const PluginsProvider: FC = ({ children }) => {
  const [plugins, setPlugins] = useState<FormPlugin[]>([])

  const addPlugin = (plugin: FormPlugin) => {
    setPlugins([...plugins, plugin])
  }

  const pluginData = {
    plugins,
    addPlugin,
  }

  return (
    <PluginsContext.Provider value={pluginData}>
      {children}
    </PluginsContext.Provider>
  )
}
