import { redirect } from 'next/navigation'

/**
 * `/ledger/transactions` became `/ledger/journal`.
 *
 * The page lists journal entries — the complete accounting record — with
 * source transactions as a secondary view. "Transactions" named the
 * adapter mirror rather than the ledger, and the mirror is partial: it
 * holds only what a source system had a record of. Kept as a permanent
 * redirect so existing bookmarks and links survive the rename.
 */
export default function TransactionsRedirect() {
  redirect('/ledger/journal')
}
