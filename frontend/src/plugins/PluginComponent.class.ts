// plugin/SomeComponent/index.tsx

// ParentSingleton.register(SomeComponent)

// enum CURRENT_STATE {
//   NO_AUTH,
//   AUTH_LOADING,
//   FETCHING_DATA,
//   LOADED_DATA,
// }
export abstract class PluginComponent {
  /**
   * Method to initialise the component
   */
  async initialise(): Promise<any> {
    return {}
  }

  /**
   * Method to render the component
   * @param state
   */
  render(state: string) {
    return {}
  }
}
