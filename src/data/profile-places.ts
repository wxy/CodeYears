export interface ProfileOrganization {
  login: string;
  avatar?: HTMLImageElement;
}

export const PROFILE_CARD_SELECTOR = ".Layout-sidebar .h-card";

// GitHub 的账号提及和组织徽标链接都直接指向 /login。
const accountLink = /^(?:https:\/\/github\.com)?\/([a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38})\/?$/i;
const organizationLink = 'a[data-hovercard-type="organization"][href]';

export function findProfileCard(doc: Document, profile: string): Element | undefined {
  const owner = profile.toLowerCase();
  return [...doc.querySelectorAll(PROFILE_CARD_SELECTOR)].find(element =>
    element.querySelector(".vcard-username")?.textContent.trim().toLowerCase() === owner);
}

export function readProfilePlaces(doc: Document, profile: string, card = findProfileCard(doc, profile)): { people: string[]; organizations: ProfileOrganization[] } {
  if (!card) return { people: [], organizations: [] };

  const organizations = new Map<string, ProfileOrganization>();
  for (const selector of [`${organizationLink}.avatar-group-item`, `.user-profile-bio ${organizationLink}`, `.vcard-details ${organizationLink}`]) {
    for (const link of card.querySelectorAll(selector)) {
      const login = accountLink.exec(link.getAttribute("href")!)?.[1];
      if (!login) continue;
      const key = login.toLowerCase();
      const organization = organizations.get(key) ?? { login };
      const image = link.querySelector("img");
      if (!organization.avatar && image?.complete && image.naturalWidth > 0) organization.avatar = image;
      organizations.set(key, organization);
    }
  }

  const people: string[] = [];
  const seen = new Set([profile.toLowerCase(), ...organizations.keys()]);
  for (const link of card.querySelectorAll('.user-profile-bio a[data-hovercard-type="user"][href]')) {
    const login = accountLink.exec(link.getAttribute("href")!)?.[1];
    if (!login || seen.has(login.toLowerCase())) continue;
    seen.add(login.toLowerCase());
    people.push(login);
    if (people.length === 8) break;
  }
  return { people, organizations: [...organizations.values()] };
}
