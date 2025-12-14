import { createTheme, theme } from 'flowbite-react'
import { twMerge } from 'tailwind-merge'

export const customTheme = createTheme({
  // RoboSystems Theme
  alert: {
    base: 'flex flex-col gap-2 rounded-xl p-4 text-sm backdrop-blur-sm',
    borderAccent: 'border-l-4',
    color: {
      failure:
        'border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300',
      success:
        'border-secondary-400 bg-secondary-50 text-secondary-800 dark:border-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300',
      warning:
        'border-accent-400 bg-accent-50 text-accent-800 dark:border-accent-600 dark:bg-accent-900/20 dark:text-accent-300',
      info: 'border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-300',
    },
    icon: 'mr-3 inline h-5 w-5 shrink-0',
    rounded: 'rounded-xl',
    wrapper: 'flex items-center',
  },
  avatar: {
    root: {
      base: 'flex items-center justify-center space-x-4',
      bordered: 'ring-primary-300 dark:ring-primary-600 ring-2',
      rounded: 'rounded-full',
      color: {
        dark: 'ring-gray-800 dark:ring-gray-800',
        failure: 'ring-red-500 dark:ring-red-700',
        gray: 'ring-gray-500 dark:ring-gray-400',
        info: 'ring-primary-400 dark:ring-primary-600',
        light: 'ring-gray-300 dark:ring-gray-500',
        purple: 'ring-purple-500 dark:ring-purple-600',
        success: 'ring-secondary-500 dark:ring-secondary-600',
        warning: 'ring-accent-400 dark:ring-accent-600',
        pink: 'ring-pink-500 dark:ring-pink-800',
      },
      img: {
        base: 'rounded-full',
        off: 'from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 relative overflow-hidden bg-linear-to-br',
        on: '',
        placeholder:
          'text-primary-400 dark:text-primary-600 absolute -bottom-1 h-auto w-auto',
      },
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-20 w-20',
        xl: 'h-36 w-36',
      },
      stacked: 'ring-2 ring-white dark:ring-gray-900',
      statusPosition: {
        'bottom-left': '-bottom-1 -left-1',
        'bottom-center': '-bottom-1',
        'bottom-right': '-right-1 -bottom-1',
        'top-left': '-top-1 -left-1',
        'top-center': '-top-1',
        'top-right': '-top-1 -right-1',
        'center-right': '-right-1',
        center: '',
        'center-left': '-left-1',
      },
      status: {
        away: 'bg-accent-400',
        base: 'absolute h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-900',
        busy: 'bg-red-400',
        offline: 'bg-zinc-400',
        online: 'bg-secondary-400',
      },
      initials: {
        text: 'text-primary-700 dark:text-primary-300 font-medium',
        base: 'from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br',
      },
    },
    group: {
      base: 'flex -space-x-4',
    },
    groupCounter: {
      base: 'bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-white dark:ring-gray-900',
    },
  },
  badge: {
    root: {
      base: 'flex h-fit items-center gap-1 font-semibold backdrop-blur-sm',
      color: {
        primary:
          'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
        secondary:
          'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
        accent:
          'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
        failure: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        success:
          'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
        warning:
          'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
        info: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      },
      href: 'group',
      size: {
        xs: 'p-1 text-xs',
        sm: 'p-1.5 text-sm',
      },
    },
    icon: {
      off: 'rounded-sm px-2 py-0.5',
      on: 'rounded-full p-1.5',
      size: {
        xs: 'h-3 w-3',
        sm: 'h-3.5 w-3.5',
      },
    },
  },
  breadcrumb: {
    root: {
      base: '',
      list: 'flex items-center',
    },
    item: {
      base: 'group flex items-center',
      chevron: 'mx-1 h-4 w-4 text-gray-400 group-first:hidden md:mx-2',
      href: {
        off: 'flex items-center text-sm font-medium text-gray-500 dark:text-gray-400',
        on: 'text-primary-700 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 flex items-center text-sm font-medium',
      },
      icon: 'mr-2 h-4 w-4',
    },
  },
  button: {
    base: 'group flex items-center justify-center p-0.5 text-center font-medium transition-all duration-200 focus:z-10 focus:ring-4',
    fullSized: 'w-full',
    color: {
      primary:
        'bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 text-white',
      secondary:
        'bg-secondary-700 hover:bg-secondary-800 focus:ring-secondary-300 dark:bg-secondary-600 dark:hover:bg-secondary-700 dark:focus:ring-secondary-800 text-white',
      accent:
        'bg-accent-700 hover:bg-accent-800 focus:ring-accent-300 dark:bg-accent-600 dark:hover:bg-accent-700 dark:focus:ring-accent-800 text-white',
      gray: 'bg-zinc-700 text-white hover:bg-zinc-800 focus:ring-gray-300 dark:bg-zinc-600 dark:hover:bg-zinc-700 dark:focus:ring-gray-800',
      light:
        'bg-zinc-50 text-gray-900 hover:bg-zinc-100 focus:ring-gray-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:focus:ring-gray-800',
      dark: 'bg-zinc-900 text-white hover:bg-zinc-950 focus:ring-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-900 dark:focus:ring-gray-800',
      failure:
        'bg-red-700 text-white hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
      success:
        'bg-green-700 text-white hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800',
      warning:
        'bg-yellow-700 text-white hover:bg-yellow-800 focus:ring-yellow-300 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800',
    },
    gradientDuoTone: {
      cyanToBlue:
        'bg-linear-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 focus:ring-cyan-300 dark:focus:ring-cyan-800',
      greenToBlue:
        'bg-linear-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 focus:ring-green-300 dark:focus:ring-green-800',
      purpleToBlue:
        'bg-linear-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 focus:ring-purple-300 dark:focus:ring-purple-800',
      purpleToPink:
        'bg-linear-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 focus:ring-purple-300 dark:focus:ring-purple-800',
      pinkToOrange:
        'bg-linear-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 focus:ring-pink-300 dark:focus:ring-pink-800',
      tealToLime:
        'bg-linear-to-r from-teal-500 to-lime-500 text-white hover:from-teal-600 hover:to-lime-600 focus:ring-teal-300 dark:focus:ring-teal-800',
    },
    inner: {
      base: 'flex items-center transition-all duration-200',
    },
    outline: {
      color: {
        primary:
          'border-primary-500 text-primary-500 hover:bg-primary-500 focus:ring-primary-300 dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-500 dark:focus:ring-primary-800 hover:text-white dark:hover:text-white',
        secondary:
          'border-secondary-500 text-secondary-500 hover:bg-secondary-500 focus:ring-secondary-300 dark:border-secondary-500 dark:text-secondary-500 dark:hover:bg-secondary-500 dark:focus:ring-secondary-800 hover:text-white dark:hover:text-white',
        accent:
          'border-accent-500 text-accent-500 hover:bg-accent-500 focus:ring-accent-300 dark:border-accent-500 dark:text-accent-500 dark:hover:bg-accent-500 dark:focus:ring-accent-800 hover:text-white dark:hover:text-white',
        gray: 'border-gray-500 text-gray-500 hover:bg-zinc-500 hover:text-white focus:ring-gray-300 dark:border-gray-500 dark:text-gray-500 dark:hover:bg-zinc-500 dark:hover:text-white dark:focus:ring-gray-800',
        light:
          'border-gray-200 text-gray-900 hover:bg-zinc-100 focus:ring-gray-300 dark:border-gray-600 dark:text-white dark:hover:bg-zinc-700 dark:focus:ring-gray-800',
        dark: 'border-gray-900 text-gray-900 hover:bg-zinc-900 hover:text-white focus:ring-gray-300 dark:border-gray-600 dark:text-white dark:hover:bg-zinc-600 dark:hover:text-white dark:focus:ring-gray-800',
        failure:
          'border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-500 dark:hover:text-white dark:focus:ring-red-800',
        success:
          'border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-500 dark:hover:text-white dark:focus:ring-green-800',
        warning:
          'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white focus:ring-yellow-300 dark:border-yellow-500 dark:text-yellow-500 dark:hover:bg-yellow-500 dark:hover:text-white dark:focus:ring-yellow-800',
      },
    },
    pill: 'rounded-full',
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-base',
    },
  },
  card: {
    root: {
      base: twMerge(
        theme.card.root.base,
        'border border-gray-200 bg-white/80 shadow-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-zinc-950'
      ),
      children: 'flex h-full flex-col justify-center gap-4 p-6',
      horizontal: {
        off: 'flex-col',
        on: 'flex-col md:max-w-xl md:flex-row',
      },
      href: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
    },
  },
  checkbox: {
    base: 'focus:ring-primary-500 dark:focus:ring-primary-600 h-4 w-4 rounded-sm border-gray-300 bg-zinc-100 focus:ring-2 dark:border-gray-600 dark:bg-zinc-700 dark:ring-offset-gray-800',
    color: {
      default: 'text-primary-600',
      dark: 'text-gray-600',
      failure: 'text-red-600',
      gray: 'text-gray-600',
      info: 'text-blue-600',
      light: 'text-gray-600',
      purple: 'text-purple-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      blue: 'text-blue-600',
      cyan: 'text-cyan-600',
      green: 'text-green-600',
      indigo: 'text-indigo-600',
      lime: 'text-lime-600',
      pink: 'text-pink-600',
      red: 'text-red-600',
      teal: 'text-teal-600',
      yellow: 'text-yellow-600',
    },
  },
  drawer: {
    root: {
      base: 'fixed z-40 overflow-y-auto bg-white p-4 transition-transform dark:bg-zinc-900',
      backdrop:
        'fixed inset-0 z-30 bg-zinc-900/50 backdrop-blur-sm dark:bg-zinc-900/80',
      edge: 'bottom-16',
      position: {
        top: {
          on: 'top-0 right-0 left-0 w-full transform-none',
          off: 'top-0 right-0 left-0 w-full -translate-y-full',
        },
        right: {
          on: 'top-0 right-0 h-screen w-80 transform-none',
          off: 'top-0 right-0 h-screen w-80 translate-x-full',
        },
        bottom: {
          on: 'right-0 bottom-0 left-0 w-full transform-none',
          off: 'right-0 bottom-0 left-0 w-full translate-y-full',
        },
        left: {
          on: 'top-0 left-0 h-screen w-80 transform-none',
          off: 'top-0 left-0 h-screen w-80 -translate-x-full',
        },
      },
    },
    header: {
      inner: {
        closeButton:
          'absolute end-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-zinc-200 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white',
        closeIcon: 'h-4 w-4',
        titleIcon: 'text-primary-600 dark:text-primary-400 me-2.5 h-5 w-5',
        titleText:
          'mb-4 inline-flex items-center text-base font-semibold text-gray-900 dark:text-white',
      },
      collapsed: {
        on: 'hidden',
        off: 'block',
      },
    },
    items: {
      base: '',
    },
  },
  dropdown: {
    floating: {
      arrow: {
        base: 'absolute z-10 h-2 w-2 rotate-45',
        style: {
          dark: 'bg-zinc-900 dark:bg-zinc-700',
          light: 'bg-white',
          auto: 'bg-white dark:bg-zinc-700',
        },
        placement: '-m-1',
      },
      animation: 'transition-opacity',
      base: 'z-10 w-fit divide-y divide-gray-100 rounded-xl shadow-lg focus:outline-hidden',
      content: 'py-1 text-sm text-gray-700 dark:text-gray-200',
      divider: 'my-1 h-px bg-zinc-100 dark:bg-zinc-600',
      header: 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200',
      hidden: 'invisible opacity-0',
      item: {
        container: '',
        base: 'flex cursor-pointer items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-zinc-100 dark:text-gray-200 dark:hover:bg-zinc-600',
        icon: 'mr-2 h-4 w-4',
      },
      style: {
        dark: 'bg-zinc-900 text-white dark:bg-zinc-700',
        light: 'border border-gray-200 bg-white text-gray-900',
        auto: 'border border-gray-200 bg-white text-gray-900 dark:border-none dark:bg-zinc-700 dark:text-white',
      },
      target: 'w-fit',
    },
    content: 'py-1',
    inlineWrapper: 'flex items-center',
  },
  label: {
    root: {
      base: 'text-sm font-medium',
      disabled: 'opacity-50',
      colors: {
        default: 'text-gray-900 dark:text-white',
        info: 'text-primary-500 dark:text-primary-400',
        failure: 'text-red-700 dark:text-red-500',
        warning: 'text-accent-500 dark:text-accent-400',
        success: 'text-secondary-600 dark:text-secondary-400',
      },
    },
  },
  modal: {
    root: {
      base: 'fixed top-0 right-0 left-0 z-50 h-screen overflow-x-hidden overflow-y-auto md:inset-0 md:h-full',
      show: {
        on: 'flex bg-zinc-900/50 backdrop-blur-sm dark:bg-zinc-900/80',
        off: 'hidden',
      },
      sizes: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
      },
      positions: {
        'top-left': 'items-start justify-start',
        'top-center': 'items-start justify-center',
        'top-right': 'items-start justify-end',
        'center-left': 'items-center justify-start',
        center: 'items-center justify-center',
        'center-right': 'items-center justify-end',
        'bottom-right': 'items-end justify-end',
        'bottom-center': 'items-end justify-center',
        'bottom-left': 'items-end justify-start',
      },
    },
    content: {
      base: 'relative h-full w-full p-4 md:h-auto',
      inner:
        'relative flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-800',
    },
    body: {
      base: 'flex-1 overflow-auto p-6',
      popup: 'pt-0',
    },
    header: {
      base: 'flex items-start justify-between rounded-t-2xl p-5 dark:border-gray-700',
      popup: 'border-b-0 p-2',
      title: 'text-xl font-semibold text-gray-900 dark:text-white',
      close: {
        base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-zinc-200 hover:text-gray-900 dark:hover:bg-zinc-700 dark:hover:text-white',
        icon: 'h-5 w-5',
      },
    },
    footer: {
      base: 'flex items-center space-x-2 rounded-b-2xl p-6 dark:border-gray-700',
      popup: 'border-t',
    },
  },
  navbar: {
    root: {
      base: 'border-gray-200 bg-white/90 px-2 py-2.5 backdrop-blur-md sm:px-4 dark:border-gray-700 dark:bg-zinc-900/90',
      rounded: {
        on: 'rounded-sm',
        off: '',
      },
      bordered: {
        on: 'border',
        off: '',
      },
      inner: {
        base: 'mx-auto flex flex-wrap items-center justify-between',
        fluid: {
          on: '',
          off: 'container',
        },
      },
    },
    brand: {
      base: 'flex items-center',
    },
    collapse: {
      base: 'w-full md:block md:w-auto',
      list: 'mt-4 flex flex-col md:mt-0 md:flex-row md:space-x-8 md:text-sm md:font-medium',
      hidden: {
        on: 'hidden',
        off: '',
      },
    },
    link: {
      base: 'block py-2 pr-4 pl-3 md:p-0',
      active: {
        on: 'bg-primary-700 md:text-primary-700 text-white md:bg-transparent dark:text-white',
        off: 'md:hover:text-primary-700 border-b border-gray-100 text-gray-700 hover:bg-zinc-50 md:border-0 md:hover:bg-transparent dark:border-gray-700 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-white',
      },
      disabled: {
        on: 'text-gray-400 hover:cursor-not-allowed dark:text-gray-600',
        off: '',
      },
    },
    toggle: {
      base: 'inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-zinc-100 focus:ring-2 focus:ring-gray-200 focus:outline-hidden md:hidden dark:text-gray-400 dark:hover:bg-zinc-700 dark:focus:ring-gray-600',
      icon: 'h-6 w-6 shrink-0',
    },
  },
  progress: {
    base: 'w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700',
    label: 'mb-1 flex justify-between font-medium dark:text-white',
    bar: 'text-primary-100 dark:text-primary-100 rounded-full text-center text-xs leading-none font-medium whitespace-nowrap',
    color: {
      dark: 'bg-zinc-600 dark:bg-zinc-300',
      blue: 'bg-primary-600',
      red: 'bg-red-600 dark:bg-red-500',
      green: 'bg-secondary-600 dark:bg-secondary-500',
      yellow: 'bg-accent-400 dark:bg-accent-500',
      indigo: 'bg-indigo-600 dark:bg-indigo-500',
      purple: 'bg-purple-600 dark:bg-purple-500',
      cyan: 'bg-cyan-600',
      gray: 'bg-zinc-500',
      lime: 'bg-lime-600',
      pink: 'bg-pink-500',
      teal: 'bg-teal-600',
    },
    size: {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
      xl: 'h-6',
    },
  },
  select: {
    base: 'flex',
    addon:
      'inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-zinc-50 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-zinc-700',
    field: {
      base: 'relative w-full',
      icon: {
        base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
        svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
      },
      select: {
        base: 'block w-full border disabled:cursor-not-allowed disabled:opacity-50',
        withIcon: {
          on: 'pl-10',
          off: '',
        },
        withAddon: {
          on: 'rounded-r-lg',
          off: 'rounded-lg',
        },
        withShadow: {
          on: 'shadow-xs',
          off: '',
        },
        sizes: {
          sm: 'p-2 sm:text-xs',
          md: 'p-2.5 text-sm',
          lg: 'p-4 sm:text-base',
        },
        colors: {
          gray: 'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 border-gray-300 bg-zinc-50 text-gray-900 dark:border-gray-600 dark:bg-zinc-700 dark:text-white dark:placeholder-gray-400',
          info: 'border-primary-500 bg-primary-50 text-primary-900 placeholder-primary-700 focus:border-primary-500 focus:ring-primary-500 dark:border-primary-400 dark:bg-primary-100 dark:focus:border-primary-500 dark:focus:ring-primary-500',
          failure:
            'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
          warning:
            'border-accent-500 bg-accent-50 text-accent-900 placeholder-accent-700 focus:border-accent-500 focus:ring-accent-500 dark:border-accent-400 dark:bg-accent-100 dark:focus:border-accent-500 dark:focus:ring-accent-500',
          success:
            'border-secondary-500 bg-secondary-50 text-secondary-900 placeholder-secondary-700 focus:border-secondary-500 focus:ring-secondary-500 dark:border-secondary-400 dark:bg-secondary-100 dark:focus:border-secondary-500 dark:focus:ring-secondary-500',
        },
      },
    },
  },
  sidebar: {
    root: {
      base: 'h-full',
      collapsed: {
        on: 'w-16',
        off: 'w-64',
      },
      inner: twMerge(
        theme.sidebar.root.inner,
        'h-full overflow-x-hidden overflow-y-auto rounded-sm bg-white px-3 py-4 dark:bg-zinc-950'
      ),
    },
    collapse: {
      button: twMerge(
        theme.sidebar.collapse.button,
        'group w-full text-gray-900 hover:bg-zinc-100 dark:text-gray-200 dark:hover:bg-zinc-700/50'
      ),
      icon: {
        base: 'h-6 w-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white',
        open: {
          off: '',
          on: 'text-gray-900',
        },
      },
      label: {
        base: 'ml-3 flex-1 text-left whitespace-nowrap',
        icon: {
          base: 'h-6 w-6 transition delay-0 ease-in-out',
          open: {
            on: 'rotate-180',
            off: '',
          },
        },
      },
      list: 'space-y-2 py-2',
    },
    cta: {
      base: 'mt-6 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800',
      color: {
        blue: 'bg-blue-50 dark:bg-blue-900/20',
        dark: 'bg-zinc-50 dark:bg-zinc-900/20',
        failure: 'bg-red-50 dark:bg-red-900/20',
        gray: 'bg-zinc-50 dark:bg-zinc-900/20',
        green: 'bg-green-50 dark:bg-green-900/20',
        light: 'bg-zinc-50 dark:bg-zinc-800/20',
        red: 'bg-red-50 dark:bg-red-900/20',
        purple: 'bg-purple-50 dark:bg-purple-900/20',
        success: 'bg-green-50 dark:bg-green-900/20',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20',
      },
    },
    item: {
      base: twMerge(
        theme.sidebar.item.base,
        'flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-zinc-100 dark:text-gray-200 dark:hover:bg-zinc-700/50'
      ),
      active:
        'bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white',
      collapsed: {
        insideCollapse: 'group w-full pl-8 transition duration-75',
        noIcon: 'font-bold',
      },
      content: {
        base: 'flex-1 px-3 whitespace-nowrap',
      },
      icon: {
        base: 'h-6 w-6 shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white',
        active: 'text-gray-700 dark:text-gray-100',
      },
      label: '',
      listItem: '',
      hover:
        'hover:bg-zinc-100 dark:hover:bg-zinc-700/50 dark:hover:text-white',
    },
    items: {
      base: '',
    },
    itemGroup: {
      base: twMerge(
        theme.sidebar.itemGroup.base,
        'mt-4 space-y-2 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 dark:border-gray-700'
      ),
    },
    logo: {
      base: 'mb-5 flex items-center pl-2.5',
      collapsed: {
        on: 'hidden',
        off: 'self-center text-xl font-semibold whitespace-nowrap dark:text-white',
      },
      img: 'mr-3 h-6 sm:h-7',
    },
  },
  spinner: {
    base: 'inline animate-spin text-gray-200 dark:text-gray-600',
    color: {
      primary: 'fill-primary-600 dark:fill-primary-500',
      secondary: 'fill-secondary-600 dark:fill-secondary-500',
      accent: 'fill-accent-600 dark:fill-accent-500',
      failure: 'fill-red-600 dark:fill-red-500',
      gray: 'fill-gray-600 dark:fill-gray-500',
      info: 'fill-cyan-600 dark:fill-cyan-500',
      pink: 'fill-pink-600 dark:fill-pink-500',
      purple: 'fill-purple-600 dark:fill-purple-500',
      success: 'fill-green-500 dark:fill-green-400',
      warning: 'fill-yellow-400 dark:fill-yellow-300',
    },
    light: {
      off: {
        base: 'text-gray-600 dark:text-gray-400',
        color: {
          failure: '',
          gray: '',
          info: '',
          pink: '',
          purple: '',
          success: '',
          warning: '',
        },
      },
      on: {
        base: '',
        color: {
          failure: 'text-red-600 dark:text-red-500',
          gray: 'dark:text-gray-500',
          info: 'text-cyan-600 dark:text-cyan-500',
          pink: 'text-pink-600 dark:text-pink-500',
          purple: 'text-purple-600 dark:text-purple-500',
          success: 'text-green-600 dark:text-green-500',
          warning: 'text-yellow-600 dark:text-yellow-500',
        },
      },
    },
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-10 w-10',
    },
  },
  table: {
    root: {
      base: 'w-full text-left text-sm text-gray-500 dark:text-gray-400',
      shadow:
        'absolute top-0 left-0 -z-10 h-full w-full rounded-lg bg-white drop-shadow-md dark:bg-zinc-800',
      wrapper: 'relative',
    },
    body: {
      base: 'group/body',
      cell: {
        base: 'p-4',
      },
    },
    head: {
      base: 'group/head text-xs text-gray-700 uppercase dark:text-gray-400',
      cell: {
        base: 'bg-zinc-50 p-4 dark:bg-zinc-700',
      },
    },
    row: {
      base: 'group/row',
      hovered: 'hover:bg-zinc-50 dark:hover:bg-zinc-600',
      striped:
        'odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-800 dark:even:bg-zinc-700',
    },
  },
  tabs: {
    base: 'flex flex-col gap-2',
    tablist: {
      base: 'flex text-center',
      styles: {
        default: 'flex-wrap border-b border-gray-200 dark:border-gray-700',
        underline:
          '-mb-px flex-wrap border-b border-gray-200 dark:border-gray-700',
        pills:
          'flex-wrap space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400',
        fullWidth:
          'grid w-full grid-flow-col divide-x divide-gray-200 rounded-none text-sm font-medium shadow dark:divide-gray-700 dark:text-gray-400',
      },
      tabitem: {
        base: 'focus:ring-primary-300 mx-1 flex items-center justify-center rounded-t-lg px-4 py-3 text-sm font-medium first:ml-0 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500',
        styles: {
          default: {
            base: 'rounded-t-lg',
            active: {
              on: 'text-primary-600 dark:text-primary-400 bg-white dark:bg-zinc-800',
              off: 'text-gray-500 hover:bg-zinc-50 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-gray-300',
            },
          },
          underline: {
            base: 'rounded-t-lg',
            active: {
              on: 'active border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 rounded-t-lg border-b-2',
              off: 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300',
            },
          },
          pills: {
            base: '',
            active: {
              on: 'bg-primary-600 rounded-lg text-white',
              off: 'rounded-lg hover:bg-zinc-100 hover:text-gray-900 dark:hover:bg-zinc-700 dark:hover:text-white',
            },
          },
          fullWidth: {
            base: 'ml-0 flex w-full rounded-none first:ml-0',
            active: {
              on: 'active rounded-none bg-white p-4 text-gray-900 dark:bg-zinc-700 dark:text-white',
              off: 'rounded-none bg-white hover:bg-zinc-50 hover:text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-white',
            },
          },
        },
        icon: 'mr-2 h-5 w-5',
      },
    },
    tabitemcontainer: {
      base: '',
      styles: {
        default: '',
        underline: '',
        pills: '',
        fullWidth: '',
      },
    },
    tabpanel: 'py-3',
  },
  textarea: {
    base: twMerge(theme.textarea.base, 'p-4'),
    colors: {
      gray: twMerge(
        theme.textarea.colors.gray,
        'focus:border-secondary-500 focus:ring-secondary-500 dark:focus:border-secondary-500 dark:focus:ring-secondary-500 text-base sm:text-sm'
      ),
      info: 'border-primary-500 bg-primary-50 text-primary-900 placeholder-primary-700 focus:border-primary-500 focus:ring-primary-500 dark:border-primary-400 dark:bg-primary-100 dark:focus:border-primary-500 dark:focus:ring-primary-500',
      failure:
        'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
      warning:
        'border-accent-500 bg-accent-50 text-accent-900 placeholder-accent-700 focus:border-accent-500 focus:ring-accent-500 dark:border-accent-400 dark:bg-accent-100 dark:focus:border-accent-500 dark:focus:ring-accent-500',
      success:
        'border-secondary-500 bg-secondary-50 text-secondary-900 placeholder-secondary-700 focus:border-secondary-500 focus:ring-secondary-500 dark:border-secondary-400 dark:bg-secondary-100 dark:focus:border-secondary-500 dark:focus:ring-secondary-500',
    },
    withShadow: {
      on: 'shadow-xs',
      off: '',
    },
  },
  textInput: {
    addon:
      'inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-zinc-50 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-zinc-700',
    field: {
      base: 'relative w-full',
      icon: {
        base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
        svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
      },
      rightIcon: {
        base: 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
        svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
      },
      input: {
        base: twMerge(
          theme.textInput.field.input.base,
          'block w-full border outline-hidden disabled:cursor-not-allowed disabled:opacity-50'
        ),
        sizes: {
          sm: 'p-2 sm:text-xs',
          md: 'p-2.5 sm:text-sm',
          lg: 'p-4 sm:text-base',
        },
        colors: {
          gray: 'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 border-gray-300 bg-zinc-50 text-gray-900 dark:border-gray-600 dark:bg-zinc-700 dark:text-white dark:placeholder-gray-400',
          info: 'border-primary-500 bg-primary-50 text-primary-900 placeholder-primary-700 focus:border-primary-500 focus:ring-primary-500 dark:border-primary-400 dark:bg-primary-100 dark:focus:border-primary-500 dark:focus:ring-primary-500',
          failure:
            'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
          warning:
            'border-accent-500 bg-accent-50 text-accent-900 placeholder-accent-700 focus:border-accent-500 focus:ring-accent-500 dark:border-accent-400 dark:bg-accent-100 dark:focus:border-accent-500 dark:focus:ring-accent-500',
          success:
            'border-secondary-500 bg-secondary-50 text-secondary-900 placeholder-secondary-700 focus:border-secondary-500 focus:ring-secondary-500 dark:border-secondary-400 dark:bg-secondary-100 dark:focus:border-secondary-500 dark:focus:ring-secondary-500',
        },
        withRightIcon: {
          on: 'pr-10',
          off: '',
        },
        withIcon: {
          on: 'pl-10',
          off: '',
        },
        withAddon: {
          on: 'rounded-r-lg',
          off: 'rounded-lg',
        },
        withShadow: {
          on: 'shadow-xs',
          off: '',
        },
      },
    },
  },
  toggleSwitch: {
    root: {
      base: 'group relative flex items-center rounded-lg',
      active: {
        on: 'cursor-pointer',
        off: 'cursor-not-allowed opacity-50',
      },
      label: 'ml-3 text-sm font-medium text-gray-900 dark:text-gray-300',
    },
    toggle: {
      base: 'toggle-bg rounded-full border',
      checked: {
        on: 'after:translate-x-full after:border-white',
        off: 'border-gray-200 bg-zinc-200 dark:border-gray-600 dark:bg-zinc-700',
        color: {
          blue: 'border-primary-600 bg-primary-600',
          dark: 'border-gray-900 bg-zinc-800',
          failure: 'border-red-700 bg-red-700',
          gray: 'border-gray-500 bg-zinc-500',
          green: 'border-secondary-600 bg-secondary-600',
          light: 'border-gray-200 bg-zinc-100',
          red: 'border-red-700 bg-red-700',
          purple: 'border-purple-700 bg-purple-700',
          success: 'border-secondary-500 bg-secondary-500',
          yellow: 'border-accent-400 bg-accent-400',
          warning: 'border-accent-600 bg-accent-600',
          cyan: 'border-cyan-500 bg-cyan-500',
          lime: 'border-lime-500 bg-lime-500',
          indigo: 'border-indigo-500 bg-indigo-500',
          default: 'border-primary-600 bg-primary-600',
          pink: 'border-pink-600 bg-pink-600',
          teal: 'border-teal-600 bg-teal-600',
        },
      },
      sizes: {
        sm: 'h-5 w-9 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4',
        md: 'h-6 w-11 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5',
        lg: 'h-7 w-14 after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6',
      },
    },
  },
  tooltip: {
    target: 'w-fit',
    animation: 'transition-opacity',
    arrow: {
      base: 'absolute z-10 h-2 w-2 rotate-45',
      style: {
        dark: 'bg-zinc-900 dark:bg-zinc-700',
        light: 'bg-white',
        auto: 'bg-white dark:bg-zinc-700',
      },
      placement: '-m-1',
    },
    base: 'absolute z-10 inline-block rounded-lg px-3 py-2 text-sm font-medium shadow-xs',
    hidden: 'invisible opacity-0',
    style: {
      dark: 'bg-zinc-900 text-white dark:bg-zinc-700',
      light: 'border border-gray-200 bg-white text-gray-900',
      auto: 'border border-gray-200 bg-white text-gray-900 dark:border-none dark:bg-zinc-700 dark:text-white',
    },
    content: 'relative z-20',
  },
})
