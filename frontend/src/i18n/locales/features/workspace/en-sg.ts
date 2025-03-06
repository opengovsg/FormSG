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
  },
  actions: {
    preview: 'Preview',
    duplicate: 'Duplicate',
    share: 'Share form',
    admins: 'Manage form admins',
    move: 'Move to Folder',
  },
  modals: {
    delete: {
      title: 'Delete form',
      description:
        'You will lose all responses and feedback for the following form permanently. Are you sure you want to delete the form?',
      confirm: 'Yes, delete form',
    },
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
        up: 'string',
        down: 'string',
      },
      aria: {
        close: 'close feedback box',
      },
    },
  },
}
