'use server'

import { creditVisibilityCookie } from '../lib/credit-visibility-cookie'

export async function getCreditVisibility() {
  const { showCredits } = await creditVisibilityCookie.get()
  return showCredits
}

export async function setCreditVisibility(showCredits: boolean) {
  await creditVisibilityCookie.set({ showCredits })
}
