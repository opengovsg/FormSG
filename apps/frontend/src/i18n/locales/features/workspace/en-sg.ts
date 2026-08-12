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
      prompt: 'How is your experience using FormSG?',
      fieldTitle: 'Rate your experience',
    },
    comment: {
      label: {
        low: 'What went wrong?',
        mid: 'What could we improve?',
        high: 'What did you enjoy most?',
      },
      placeholder: 'Tell us more...',
      aria: {
        close: 'close feedback box',
      },
    },
    toast: {
      success: 'Thank you for your feedback!',
      submitError: 'Your feedback could not be saved. Please try again.',
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
