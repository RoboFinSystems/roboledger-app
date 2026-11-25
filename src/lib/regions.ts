export interface CodeOption {
  value: string
  label: string
}

/** US states, DC and the inhabited territories, by USPS code. */
export const US_STATES: ReadonlyArray<CodeOption> = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
  ['AS', 'American Samoa'],
  ['GU', 'Guam'],
  ['MP', 'Northern Mariana Islands'],
  ['PR', 'Puerto Rico'],
  ['VI', 'U.S. Virgin Islands'],
].map(([value, label]) => ({ value, label }))

/** ISO 3166-1 alpha-2 codes; names come from the browser's region names. */
const COUNTRY_CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ ' +
  'BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR ' +
  'CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ' +
  'ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ ' +
  'LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ ' +
  'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF ' +
  'PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI ' +
  'SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR ' +
  'TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ')

function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Countries by name, the United States first. */
export const COUNTRIES: ReadonlyArray<CodeOption> = (() => {
  const all = COUNTRY_CODES.map((value) => ({
    value,
    label: regionName(value),
  }))
  const us = all.filter((c) => c.value === 'US')
  const rest = all
    .filter((c) => c.value !== 'US')
    .sort((a, b) => a.label.localeCompare(b.label))
  return [...us, ...rest]
})()

/** The readable name of a code on a list; a value off the list shows as stored. */
export function codeLabel(
  options: ReadonlyArray<CodeOption>,
  value?: string | null
): string {
  if (!value) return ''
  return options.find((o) => o.value === value)?.label ?? value
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "06-30" as "June 30"; anything else as stored. */
export function formatFiscalYearEnd(value?: string | null): string {
  if (!value) return ''
  const match = /^(\d{2})-(\d{2})$/.exec(value)
  const month = match ? MONTHS[Number(match[1]) - 1] : undefined
  return month ? `${month} ${Number(match![2])}` : value
}

/** Identifier shapes the server checks; '' when the value fits. */
export function identifierError(field: 'lei' | 'cik', value: string): string {
  const v = value.trim().toUpperCase()
  if (!v) return ''
  if (field === 'lei' && !/^[A-Z0-9]{18}[0-9]{2}$/.test(v))
    return 'An LEI is 20 letters and digits, ending in two digits.'
  if (field === 'cik' && !/^[0-9]{1,10}$/.test(v))
    return 'A CIK is up to 10 digits.'
  return ''
}

/** A US EIN reads NN-NNNNNNN; a hint, since a tax ID can be foreign. */
export function einHint(value: string): string {
  const v = value.trim()
  if (!v || /^\d{2}-?\d{7}$/.test(v)) return ''
  return 'A US EIN reads 12-3456789.'
}
