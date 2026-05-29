export async function load({ locals }) {
  const displayName = getDisplayName(locals.user);

  return {
    user: locals.user
      ? {
          id: locals.user.id,
          email: locals.user.email,
          name: locals.user.name,
          displayName,
          image: locals.user.image
        }
      : null
  };
}

function getDisplayName(user) {
  if (!user) return null;

  const name = String(user.name || '').trim();
  const email = String(user.email || '').trim();

  if (name && !isPlaceholderName(name)) {
    return name;
  }

  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return name || 'User';
}

function isPlaceholderName(name) {
  return ['user name', 'username', 'test user'].includes(name.toLowerCase());
}
