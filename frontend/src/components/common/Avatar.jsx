import { initials } from '../../utils/constants';

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

// Renders the user's real avatar image if we have one (only the logged-in user's
// avatar is ever fetched from the backend - other users only ever come back with
// name/email, since every populate() call in the controllers selects 'name email').
// Falls back to initials so we never invent a fake photo.
export default function Avatar({ name, avatarUrl, size = 'sm', className = '' }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'avatar'}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span className={`avatar-initials ${sizeClass} ${className}`}>
      {initials(name)}
    </span>
  );
}
