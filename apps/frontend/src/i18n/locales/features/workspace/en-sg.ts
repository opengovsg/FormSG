import { enSG as header } from './header'
import { enSG as modals } from './modals'
import { enSG as sideMenu } from './side-menu'
import { Workspace } from '.'

export const enSG: Workspace = {
  common: {
    createForm: 'Create form',
  },
  empty: {
    default: {
      title: "You don't have any forms yet",
      subText: 'Get started by creating a new form',
    },
    new: {
      title: "You don't have any forms in this folder yet",
      subText: 'Organise your forms by grouping them into folders',
    },
  },
  search: {
    placeholder: 'Search by title',
    aria: {
      filter: 'Filter forms',
      expand: 'Expand search bar',
      reset: 'Close and reset search bar',
    },
    noneFound: {
      title: 'No forms found',
      subText: 'Try another search or remove filters',
    },
    // TODO [MRF-CUTOVER]: Remove after cutover.
    legacyFilterLabel: 'Legacy forms',
  },
  actions: {
    preview: 'Preview',
    duplicate: 'Duplicate',
    share: 'Share form',
    admins: 'Manage collaborators',
    move: 'Move to folder',
  },
  skeleton: {
    title: 'Loading title... Loading title...',
    metadata: 'Also loading metadata...',
  },
  feedback: {
    rating: {
      prompt: 'How was your form building experience?',
      aria: {
        up: 'Good',
        down: 'Bad',
      },
    },
    callForComment: {
      up: {
        title: "Thank you, you're the best!",
        link: 'Want to tell us more?',
      },
      down: {
        title: 'Thank you for your feedback.',
        link: 'Tell us more so we can improve!',
      },
    },
    comment: {
      title: 'Great!',
      description:
        'Tell us about your form building experience in more detail!',
      placeholder: {
        up: 'Form is awesome',
        down: 'How can we improve your experience?',
      },
      aria: {
        close: 'close feedback box',
      },
    },
  },
  workspacePage: {
    defaultTitle: 'All forms',
    // TODO [MRF-CUTOVER]: Remove after cutover.
    migrationInfobox: {
      message:
        "We're streamlining form set-up and bringing workflows to all. Legacy forms will be migrated automatically and no action is required from you.",
      learnMore: 'Learn more.',
    },
  },
  sideMenu,
  header,
  modals,
}
