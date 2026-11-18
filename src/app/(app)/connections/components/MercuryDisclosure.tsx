import Image from 'next/image'

export const MERCURY_URL = 'https://mercury.com'

/** Mercury's required not-a-bank disclosure, verbatim from its partner
 *  disclosure guidance (revised 2026-03-13). Do not paraphrase. */
export const MERCURY_DISCLOSURE =
  'Mercury is a fintech company, not an FDIC-insured bank. Banking services provided through Choice Financial Group and Column N.A., Members FDIC.'

/** Mercury's required disclosure for any mention of Mercury Treasury that
 *  does not state a yield, verbatim from the same guidance. */
export const MERCURY_TREASURY_DISCLOSURE =
  'Mercury Treasury is offered by Mercury Advisory, LLC, an SEC-registered investment adviser (“Mercury Advisory”). Treasury accounts are custodied by Apex Clearing Corporation (member FINRA/SIPC). Treasury accounts are not FDIC insured, are not bank deposits, and are not guaranteed by Choice Financial Group or Column N.A., and may lose value. Please review Mercury Advisory’s ADV Wrap Fee Brochure for more detail. This is not an offer to sell or the solicitation of any offer to purchase any security. Mercury Treasury products are subject to investment risks and past performance is not indicative of future results. Please see full disclosures at mercury.com/treasury. Mercury Advisory is a wholly-owned subsidiary of Mercury Technologies, Inc.'

interface MercuryDisclosureProps {
  /** The disclosure follows an asterisked trigger word above it. */
  asterisk?: boolean
  className?: string
}

/** The disclosure as text: the guidance requires it on the screen itself,
 *  near the trigger word, at the neighbouring text's size; never behind a
 *  link or a tooltip. */
export function MercuryDisclosure({
  asterisk = false,
  className = '',
}: MercuryDisclosureProps) {
  return (
    <p
      className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
      data-testid="mercury-disclosure"
    >
      {asterisk && '*'}
      {MERCURY_DISCLOSURE}
    </p>
  )
}

/** The logo on a white tile, as the media kit shows it, so the dark mark
 *  reads in dark mode too. */
export function MercuryLogomark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-gray-200 dark:ring-gray-600"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/mercury_logomark.svg"
        alt="Mercury"
        width={size - 8}
        height={size - 8}
      />
    </span>
  )
}

/** "Powered by Mercury" with the wordmark, a mercury.com link and the
 *  disclosure: the block every screen of the Mercury flow carries. */
export function PoweredByMercury({
  asterisk = false,
  className = '',
}: MercuryDisclosureProps) {
  return (
    <div
      className={`space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Powered by
        </span>
        <a
          href={MERCURY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded bg-white px-2 py-1 ring-1 ring-gray-200 dark:ring-gray-600"
          aria-label="Mercury (opens mercury.com)"
        >
          <Image
            src="/images/mercury_logo.svg"
            alt="Mercury"
            width={86}
            height={20}
          />
        </a>
        <a
          href={MERCURY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 text-sm underline"
        >
          mercury.com
        </a>
      </div>
      <MercuryDisclosure asterisk={asterisk} />
    </div>
  )
}
