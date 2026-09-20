import React from 'react';
import { socialIcon, type SocialLink } from '../../types/siteSettings';

interface SocialLinksProps {
  links?: SocialLink[];
  className?: string;
}

/**
 * The admin-configured social icons. Renders nothing at all when no links are
 * configured, so a site without social accounts doesn't show an empty row.
 */
const SocialLinks: React.FC<SocialLinksProps> = ({ links, className = 'tg-footer-social' }) => {
  const valid = (links || []).filter((link) => link?.url);
  if (valid.length === 0) return null;

  return (
    <div className={className}>
      {valid.map((link) => (
        <a
          key={`${link.platform}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.platform}
          title={link.platform}
        >
          <i className={socialIcon(link.platform)} aria-hidden="true"></i>
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
