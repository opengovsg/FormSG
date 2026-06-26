import { Header } from './header'
import { Modals } from './modals'
import { SideMenu } from './side-menu'

export * from './en-sg'

export interface Workspace {
  common: {
    createForm: string
  }
  empty: {
    default: {
      title: string
      subText: string
    }
    new: {
      title: string
      subText: string
    }
  }
  search: {
    placeholder: string
    aria: {
      filter: string
      expand: string
      reset: string
    }
    noneFound: {
      title: string
      subText: string
    }
    // TODO [MRF-CUTOVER]: Remove after cutover. Label for the Legacy filter
    // option shown while the flag is on (other options render their enum value).
    legacyFilterLabel: string
  }
  actions: {
    preview: string
    duplicate: string
    share: string
    admins: string
    move: string
  }
  skeleton: {
    title: string
    metadata: string
  }
  feedback: {
    rating: {
      prompt: string
      fieldTitle: string
    }
    comment: {
      label: {
        low: string
        mid: string
        high: string
      }
      placeholder: string
      aria: {
        close: string
      }
    }
  }
  workspacePage: {
    defaultTitle: string
    // TODO [MRF-CUTOVER]: Remove after cutover. Shown only when the flag is on
    // and the admin has a legacy (Encrypt) form to migrate.
    migrationInfobox: {
      message: string
      learnMore: string
    }
  }
  sideMenu: SideMenu
  header: Header
  modals: Modals
}
