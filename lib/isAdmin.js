export function isAdmin(userId) {
  return userId === process.env.ADMIN_USER_ID;
}