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
      aria: {
        up: string
        down: string
      }
    }
    callForComment: {
      up: {
        title: string
        link: string
      }
      down: {
        title: string
        link: string
      }
    }
    comment: {
      title: string
      description: string
      placeholder: {
        up: string
        down: string
      }
      aria: {
        close: string
      }
    }
  }
  workspacePage: {
    defaultTitle: string
  }
  sideMenu: SideMenu
  header: Header
  modals: Modals
}
