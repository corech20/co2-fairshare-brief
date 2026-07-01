export interface PartnerConfig {
  slug: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  hintText: string;
  contactUrl?: string;
  contactLabel?: string;
  accessCodeRequired?: boolean;
}

export const partners: Record<string, PartnerConfig> = {
  'mieterbund-nrw': {
    slug: 'mieterbund-nrw',
    name: 'Mieterbund NRW',
    shortName: 'Mieterbund NRW',
    hintText:
      'Die Berechnung ersetzt keine rechtliche Beratung. Bei Fragen wenden Sie sich bitte an Ihren örtlichen Mieterverein.',
    contactLabel: 'Örtlichen Mieterverein finden',
    contactUrl: 'https://www.mieterbund-nrw.de/',
    accessCodeRequired: false,
  },
};

export function getPartner(slug: string): PartnerConfig | undefined {
  return partners[slug];
}