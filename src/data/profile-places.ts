export interface ProfileOrganization {
  login: string;
  avatar?: HTMLImageElement;
}

export const PROFILE_CARD_SELECTOR = ".Layout-sidebar .h-card";

interface ProfilePlaces {
  people: string[];
  organizations: ProfileOrganization[];
  connections: number;
}

// GitHub 的账号提及和组织徽标链接都直接指向 /login。
const accountLink = /^(?:https:\/\/github\.com)?\/([a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38})\/?$/i;
const organizationLink = 'a[data-hovercard-type="organization"][href]';

export function findProfileCard(doc: Document, profile: string): Element | undefined {
  const owner = profile.toLowerCase();
  // 登录页可在同一个元素中显示「账号 · 代词」。
  return [...doc.querySelectorAll(PROFILE_CARD_SELECTOR)].find(element =>
    element.querySelector(".vcard-username")?.textContent.split("·", 1)[0].trim().toLowerCase() === owner);
}

export function readProfilePlaces(doc: Document, profile: string, card = findProfileCard(doc, profile)): ProfilePlaces {
  if (!card) return { people: [], organizations: [], connections: 0 };

  // 两个已显示计数只调节车流，合计无需请求账号列表。
  let connections = 0;
  for (const tab of ["followers", "following"]) {
    const count = card.querySelector(`a[href$="?tab=${tab}"] .text-bold`)?.textContent.trim();
    const match = count?.match(/^(?:(\d+(?:,\d{3})*)|(\d+(?:\.\d+)?)([km]))$/i);
    if (!match) continue;
    const suffix = match[3]?.toLowerCase();
    const value = Math.round(Number((match[1] ?? match[2]).replaceAll(",", "")) *
      (suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1));
    if (Number.isSafeInteger(value)) connections += value;
  }

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
  return { people, organizations: [...organizations.values()], connections };
}
