import { CreateModal } from './create'
import { SideMenu } from './side-menu'

export * from './en-sg'

interface Modal {
  title: string
  description: string
  confirm: string
}

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
  modals: {
    create: CreateModal
    delete: Modal
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
  sideMenu: SideMenu
}
