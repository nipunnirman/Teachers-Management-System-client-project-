import { Languages } from 'lucide-react';
import { getLanguage, setLanguage, tr } from '../../utils/i18n';

const OPTIONS = [
  { value: 'si', label: 'සිංහල' },
  { value: 'en', label: 'English' },
];

export default function LanguageSwitch() {
  const current = getLanguage();
  return (
    <div className="language-row">
      <span className="language-label">
        <Languages className="nav-icon" size={18} />
        {tr('භාෂාව')}
      </span>
      <div className="language-switch" role="group" aria-label={tr('භාෂාව')}>
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            lang={value}
            className={`language-option${current === value ? ' active' : ''}`}
            aria-pressed={current === value}
            onClick={() => setLanguage(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
