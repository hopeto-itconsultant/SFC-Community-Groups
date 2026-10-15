import { MOBILE_PATTERN } from "./login-id";

/** Country calling codes for the Admin mobile fields. India is first; the rest are A–Z. */
export interface Country {
  iso: string;
  name: string;
  /** Calling codes without "+". The first is the one shown and saved. */
  dials: readonly string[];
}

export const DEFAULT_COUNTRY_ISO = "IN";

const COUNTRY_DATA: readonly Country[] = [
  { iso: "AF", name: "Afghanistan", dials: ["93"] },
  { iso: "AL", name: "Albania", dials: ["355"] },
  { iso: "DZ", name: "Algeria", dials: ["213"] },
  { iso: "AS", name: "American Samoa", dials: ["1684"] },
  { iso: "AD", name: "Andorra", dials: ["376"] },
  { iso: "AO", name: "Angola", dials: ["244"] },
  { iso: "AI", name: "Anguilla", dials: ["1264"] },
  { iso: "AG", name: "Antigua and Barbuda", dials: ["1268"] },
  { iso: "AR", name: "Argentina", dials: ["54"] },
  { iso: "AM", name: "Armenia", dials: ["374"] },
  { iso: "AW", name: "Aruba", dials: ["297"] },
  { iso: "AU", name: "Australia", dials: ["61"] },
  { iso: "AT", name: "Austria", dials: ["43"] },
  { iso: "AZ", name: "Azerbaijan", dials: ["994"] },
  { iso: "BS", name: "Bahamas", dials: ["1242"] },
  { iso: "BH", name: "Bahrain", dials: ["973"] },
  { iso: "BD", name: "Bangladesh", dials: ["880"] },
  { iso: "BB", name: "Barbados", dials: ["1246"] },
  { iso: "BY", name: "Belarus", dials: ["375"] },
  { iso: "BE", name: "Belgium", dials: ["32"] },
  { iso: "BZ", name: "Belize", dials: ["501"] },
  { iso: "BJ", name: "Benin", dials: ["229"] },
  { iso: "BM", name: "Bermuda", dials: ["1441"] },
  { iso: "BT", name: "Bhutan", dials: ["975"] },
  { iso: "BO", name: "Bolivia", dials: ["591"] },
  { iso: "BA", name: "Bosnia and Herzegovina", dials: ["387"] },
  { iso: "BW", name: "Botswana", dials: ["267"] },
  { iso: "BR", name: "Brazil", dials: ["55"] },
  { iso: "VG", name: "British Virgin Islands", dials: ["1284"] },
  { iso: "BN", name: "Brunei", dials: ["673"] },
  { iso: "BG", name: "Bulgaria", dials: ["359"] },
  { iso: "BF", name: "Burkina Faso", dials: ["226"] },
  { iso: "BI", name: "Burundi", dials: ["257"] },
  { iso: "KH", name: "Cambodia", dials: ["855"] },
  { iso: "CM", name: "Cameroon", dials: ["237"] },
  { iso: "CA", name: "Canada", dials: ["1"] },
  { iso: "CV", name: "Cape Verde", dials: ["238"] },
  { iso: "KY", name: "Cayman Islands", dials: ["1345"] },
  { iso: "CF", name: "Central African Republic", dials: ["236"] },
  { iso: "TD", name: "Chad", dials: ["235"] },
  { iso: "CL", name: "Chile", dials: ["56"] },
  { iso: "CN", name: "China", dials: ["86"] },
  { iso: "CO", name: "Colombia", dials: ["57"] },
  { iso: "KM", name: "Comoros", dials: ["269"] },
  { iso: "CG", name: "Congo", dials: ["242"] },
  { iso: "CD", name: "Congo (DRC)", dials: ["243"] },
  { iso: "CK", name: "Cook Islands", dials: ["682"] },
  { iso: "CR", name: "Costa Rica", dials: ["506"] },
  { iso: "CI", name: "Côte d'Ivoire", dials: ["225"] },
  { iso: "HR", name: "Croatia", dials: ["385"] },
  { iso: "CU", name: "Cuba", dials: ["53"] },
  { iso: "CW", name: "Curaçao", dials: ["599"] },
  { iso: "CY", name: "Cyprus", dials: ["357"] },
  { iso: "CZ", name: "Czechia", dials: ["420"] },
  { iso: "DK", name: "Denmark", dials: ["45"] },
  { iso: "DJ", name: "Djibouti", dials: ["253"] },
  { iso: "DM", name: "Dominica", dials: ["1767"] },
  { iso: "DO", name: "Dominican Republic", dials: ["1809", "1829", "1849"] },
  { iso: "EC", name: "Ecuador", dials: ["593"] },
  { iso: "EG", name: "Egypt", dials: ["20"] },
  { iso: "SV", name: "El Salvador", dials: ["503"] },
  { iso: "GQ", name: "Equatorial Guinea", dials: ["240"] },
  { iso: "ER", name: "Eritrea", dials: ["291"] },
  { iso: "EE", name: "Estonia", dials: ["372"] },
  { iso: "SZ", name: "Eswatini", dials: ["268"] },
  { iso: "ET", name: "Ethiopia", dials: ["251"] },
  { iso: "FK", name: "Falkland Islands", dials: ["500"] },
  { iso: "FO", name: "Faroe Islands", dials: ["298"] },
  { iso: "FJ", name: "Fiji", dials: ["679"] },
  { iso: "FI", name: "Finland", dials: ["358"] },
  { iso: "FR", name: "France", dials: ["33"] },
  { iso: "GF", name: "French Guiana", dials: ["594"] },
  { iso: "PF", name: "French Polynesia", dials: ["689"] },
  { iso: "GA", name: "Gabon", dials: ["241"] },
  { iso: "GM", name: "Gambia", dials: ["220"] },
  { iso: "GE", name: "Georgia", dials: ["995"] },
  { iso: "DE", name: "Germany", dials: ["49"] },
  { iso: "GH", name: "Ghana", dials: ["233"] },
  { iso: "GI", name: "Gibraltar", dials: ["350"] },
  { iso: "GR", name: "Greece", dials: ["30"] },
  { iso: "GL", name: "Greenland", dials: ["299"] },
  { iso: "GD", name: "Grenada", dials: ["1473"] },
  { iso: "GP", name: "Guadeloupe", dials: ["590"] },
  { iso: "GU", name: "Guam", dials: ["1671"] },
  { iso: "GT", name: "Guatemala", dials: ["502"] },
  { iso: "GN", name: "Guinea", dials: ["224"] },
  { iso: "GW", name: "Guinea-Bissau", dials: ["245"] },
  { iso: "GY", name: "Guyana", dials: ["592"] },
  { iso: "HT", name: "Haiti", dials: ["509"] },
  { iso: "HN", name: "Honduras", dials: ["504"] },
  { iso: "HK", name: "Hong Kong", dials: ["852"] },
  { iso: "HU", name: "Hungary", dials: ["36"] },
  { iso: "IS", name: "Iceland", dials: ["354"] },
  { iso: "IN", name: "India", dials: ["91"] },
  { iso: "ID", name: "Indonesia", dials: ["62"] },
  { iso: "IR", name: "Iran", dials: ["98"] },
  { iso: "IQ", name: "Iraq", dials: ["964"] },
  { iso: "IE", name: "Ireland", dials: ["353"] },
  { iso: "IL", name: "Israel", dials: ["972"] },
  { iso: "IT", name: "Italy", dials: ["39"] },
  { iso: "JM", name: "Jamaica", dials: ["1876", "1658"] },
  { iso: "JP", name: "Japan", dials: ["81"] },
  { iso: "JO", name: "Jordan", dials: ["962"] },
  { iso: "KZ", name: "Kazakhstan", dials: ["7"] },
  { iso: "KE", name: "Kenya", dials: ["254"] },
  { iso: "KI", name: "Kiribati", dials: ["686"] },
  { iso: "XK", name: "Kosovo", dials: ["383"] },
  { iso: "KW", name: "Kuwait", dials: ["965"] },
  { iso: "KG", name: "Kyrgyzstan", dials: ["996"] },
  { iso: "LA", name: "Laos", dials: ["856"] },
  { iso: "LV", name: "Latvia", dials: ["371"] },
  { iso: "LB", name: "Lebanon", dials: ["961"] },
  { iso: "LS", name: "Lesotho", dials: ["266"] },
  { iso: "LR", name: "Liberia", dials: ["231"] },
  { iso: "LY", name: "Libya", dials: ["218"] },
  { iso: "LI", name: "Liechtenstein", dials: ["423"] },
  { iso: "LT", name: "Lithuania", dials: ["370"] },
  { iso: "LU", name: "Luxembourg", dials: ["352"] },
  { iso: "MO", name: "Macau", dials: ["853"] },
  { iso: "MG", name: "Madagascar", dials: ["261"] },
  { iso: "MW", name: "Malawi", dials: ["265"] },
  { iso: "MY", name: "Malaysia", dials: ["60"] },
  { iso: "MV", name: "Maldives", dials: ["960"] },
  { iso: "ML", name: "Mali", dials: ["223"] },
  { iso: "MT", name: "Malta", dials: ["356"] },
  { iso: "MH", name: "Marshall Islands", dials: ["692"] },
  { iso: "MQ", name: "Martinique", dials: ["596"] },
  { iso: "MR", name: "Mauritania", dials: ["222"] },
  { iso: "MU", name: "Mauritius", dials: ["230"] },
  { iso: "YT", name: "Mayotte", dials: ["262"] },
  { iso: "MX", name: "Mexico", dials: ["52"] },
  { iso: "FM", name: "Micronesia", dials: ["691"] },
  { iso: "MD", name: "Moldova", dials: ["373"] },
  { iso: "MC", name: "Monaco", dials: ["377"] },
  { iso: "MN", name: "Mongolia", dials: ["976"] },
  { iso: "ME", name: "Montenegro", dials: ["382"] },
  { iso: "MS", name: "Montserrat", dials: ["1664"] },
  { iso: "MA", name: "Morocco", dials: ["212"] },
  { iso: "MZ", name: "Mozambique", dials: ["258"] },
  { iso: "MM", name: "Myanmar", dials: ["95"] },
  { iso: "NA", name: "Namibia", dials: ["264"] },
  { iso: "NR", name: "Nauru", dials: ["674"] },
  { iso: "NP", name: "Nepal", dials: ["977"] },
  { iso: "NL", name: "Netherlands", dials: ["31"] },
  { iso: "NC", name: "New Caledonia", dials: ["687"] },
  { iso: "NZ", name: "New Zealand", dials: ["64"] },
  { iso: "NI", name: "Nicaragua", dials: ["505"] },
  { iso: "NE", name: "Niger", dials: ["227"] },
  { iso: "NG", name: "Nigeria", dials: ["234"] },
  { iso: "NU", name: "Niue", dials: ["683"] },
  { iso: "KP", name: "North Korea", dials: ["850"] },
  { iso: "MK", name: "North Macedonia", dials: ["389"] },
  { iso: "MP", name: "Northern Mariana Islands", dials: ["1670"] },
  { iso: "NO", name: "Norway", dials: ["47"] },
  { iso: "OM", name: "Oman", dials: ["968"] },
  { iso: "PK", name: "Pakistan", dials: ["92"] },
  { iso: "PW", name: "Palau", dials: ["680"] },
  { iso: "PS", name: "Palestine", dials: ["970"] },
  { iso: "PA", name: "Panama", dials: ["507"] },
  { iso: "PG", name: "Papua New Guinea", dials: ["675"] },
  { iso: "PY", name: "Paraguay", dials: ["595"] },
  { iso: "PE", name: "Peru", dials: ["51"] },
  { iso: "PH", name: "Philippines", dials: ["63"] },
  { iso: "PL", name: "Poland", dials: ["48"] },
  { iso: "PT", name: "Portugal", dials: ["351"] },
  { iso: "PR", name: "Puerto Rico", dials: ["1787", "1939"] },
  { iso: "QA", name: "Qatar", dials: ["974"] },
  { iso: "RE", name: "Réunion", dials: ["262"] },
  { iso: "RO", name: "Romania", dials: ["40"] },
  { iso: "RU", name: "Russia", dials: ["7"] },
  { iso: "RW", name: "Rwanda", dials: ["250"] },
  { iso: "KN", name: "Saint Kitts and Nevis", dials: ["1869"] },
  { iso: "LC", name: "Saint Lucia", dials: ["1758"] },
  { iso: "VC", name: "Saint Vincent and the Grenadines", dials: ["1784"] },
  { iso: "WS", name: "Samoa", dials: ["685"] },
  { iso: "SM", name: "San Marino", dials: ["378"] },
  { iso: "ST", name: "São Tomé and Príncipe", dials: ["239"] },
  { iso: "SA", name: "Saudi Arabia", dials: ["966"] },
  { iso: "SN", name: "Senegal", dials: ["221"] },
  { iso: "RS", name: "Serbia", dials: ["381"] },
  { iso: "SC", name: "Seychelles", dials: ["248"] },
  { iso: "SL", name: "Sierra Leone", dials: ["232"] },
  { iso: "SG", name: "Singapore", dials: ["65"] },
  { iso: "SX", name: "Sint Maarten", dials: ["1721"] },
  { iso: "SK", name: "Slovakia", dials: ["421"] },
  { iso: "SI", name: "Slovenia", dials: ["386"] },
  { iso: "SB", name: "Solomon Islands", dials: ["677"] },
  { iso: "SO", name: "Somalia", dials: ["252"] },
  { iso: "ZA", name: "South Africa", dials: ["27"] },
  { iso: "KR", name: "South Korea", dials: ["82"] },
  { iso: "SS", name: "South Sudan", dials: ["211"] },
  { iso: "ES", name: "Spain", dials: ["34"] },
  { iso: "LK", name: "Sri Lanka", dials: ["94"] },
  { iso: "SD", name: "Sudan", dials: ["249"] },
  { iso: "SR", name: "Suriname", dials: ["597"] },
  { iso: "SE", name: "Sweden", dials: ["46"] },
  { iso: "CH", name: "Switzerland", dials: ["41"] },
  { iso: "SY", name: "Syria", dials: ["963"] },
  { iso: "TW", name: "Taiwan", dials: ["886"] },
  { iso: "TJ", name: "Tajikistan", dials: ["992"] },
  { iso: "TZ", name: "Tanzania", dials: ["255"] },
  { iso: "TH", name: "Thailand", dials: ["66"] },
  { iso: "TL", name: "Timor-Leste", dials: ["670"] },
  { iso: "TG", name: "Togo", dials: ["228"] },
  { iso: "TO", name: "Tonga", dials: ["676"] },
  { iso: "TT", name: "Trinidad and Tobago", dials: ["1868"] },
  { iso: "TN", name: "Tunisia", dials: ["216"] },
  { iso: "TR", name: "Turkey", dials: ["90"] },
  { iso: "TM", name: "Turkmenistan", dials: ["993"] },
  { iso: "TC", name: "Turks and Caicos Islands", dials: ["1649"] },
  { iso: "TV", name: "Tuvalu", dials: ["688"] },
  { iso: "UG", name: "Uganda", dials: ["256"] },
  { iso: "UA", name: "Ukraine", dials: ["380"] },
  { iso: "AE", name: "United Arab Emirates", dials: ["971"] },
  { iso: "GB", name: "United Kingdom", dials: ["44"] },
  { iso: "US", name: "United States", dials: ["1"] },
  { iso: "UY", name: "Uruguay", dials: ["598"] },
  { iso: "UZ", name: "Uzbekistan", dials: ["998"] },
  { iso: "VU", name: "Vanuatu", dials: ["678"] },
  { iso: "VA", name: "Vatican City", dials: ["379"] },
  { iso: "VE", name: "Venezuela", dials: ["58"] },
  { iso: "VN", name: "Vietnam", dials: ["84"] },
  { iso: "VI", name: "US Virgin Islands", dials: ["1340"] },
  { iso: "YE", name: "Yemen", dials: ["967"] },
  { iso: "ZM", name: "Zambia", dials: ["260"] },
  { iso: "ZW", name: "Zimbabwe", dials: ["263"] },
];

/** India first, then every other country by name. Shared dial codes use this order. */
export const COUNTRIES: readonly Country[] = [
  ...COUNTRY_DATA.filter((c) => c.iso === DEFAULT_COUNTRY_ISO),
  ...COUNTRY_DATA.filter((c) => c.iso !== DEFAULT_COUNTRY_ISO).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  ),
];

export function countryByIso(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}

/** "India (+91)" */
export function countryLabel(country: Country): string {
  return `${country.name} (+${country.dials[0]})`;
}

/**
 * Joins the Admin's country choice with the national number. The dial code
 * always comes from the country; a 10-digit number is not assumed to be Indian.
 * Returns null when the result is not a valid E.164 number.
 */
export function combineMobile(nationalInput: string, iso: string): string | null {
  const country = countryByIso(iso) ?? countryByIso(DEFAULT_COUNTRY_ISO);
  if (!country) return null;
  const national = nationalInput.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (!/^[0-9]+$/.test(national)) return null;
  const mobile = `+${country.dials[0]}${national}`;
  return MOBILE_PATTERN.test(mobile) ? mobile : null;
}

/**
 * Splits a stored number for the Admin form. The longest matching calling code
 * wins; when several countries share it, the first in `COUNTRIES` is used
 * (India, then A–Z).
 */
export function splitMobile(stored: string): { iso: string; national: string } {
  const digits = stored.replace(/\D/g, "");
  let match: { iso: string; dial: string } | undefined;
  for (const country of COUNTRIES) {
    for (const dial of country.dials) {
      if (!digits.startsWith(dial)) continue;
      if (!match || dial.length > match.dial.length) match = { iso: country.iso, dial };
    }
  }
  if (!match) return { iso: DEFAULT_COUNTRY_ISO, national: digits };
  return { iso: match.iso, national: digits.slice(match.dial.length) };
}

/** Country and national number from an Admin form. An empty number yields `mobile: null`. */
export function readMobileFields(formData: FormData): { country: string; national: string; mobile: string | null } {
  const submitted = String(formData.get("country") ?? "").trim();
  const country = countryByIso(submitted) ? submitted : DEFAULT_COUNTRY_ISO;
  const national = String(formData.get("mobile") ?? "").trim();
  return { country, national, mobile: national ? combineMobile(national, country) : null };
}
