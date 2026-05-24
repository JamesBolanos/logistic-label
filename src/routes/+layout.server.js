export async function load({ locals }) {
  return {
    user: locals.user
      ? {
          id: locals.user.id,
          email: locals.user.email,
          username: locals.user.name,
          fullName: locals.user.name,
          image: locals.user.image
        }
      : null
  };
}
