/**
 * Usage: pnpm make-admin <email>
 *
 * Promotes a user to admin in the local D1 database.
 * Run: cd apps/api && wrangler d1 execute f1-fantasy-db --local --command "UPDATE users SET admin=1 WHERE email='<email>'"
 *
 * Or use this script via:
 *   pnpm --filter @f1/api exec wrangler d1 execute f1-fantasy-db --local --command "UPDATE users SET admin=1 WHERE email='your@email.com'"
 */

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm make-admin <email>");
  process.exit(1);
}

console.log(`
Run this command to promote ${email} to admin:

  cd apps/api && npx wrangler d1 execute f1-fantasy-db --local --command "UPDATE users SET admin=1 WHERE email='${email}'"

For remote (production):
  cd apps/api && npx wrangler d1 execute f1-fantasy-db --command "UPDATE users SET admin=1 WHERE email='${email}'"
`);
