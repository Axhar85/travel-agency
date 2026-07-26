// One-off helper so setting up the admin password never requires hand-running
// bcrypt yourself: `npm run admin:hash-password -- "the-real-password"` prints
// a hash to paste into ADMIN_PASSWORD_HASH in apps/api/.env. The plaintext
// password is never written anywhere by this script.
import * as bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run admin:hash-password -- "your-password"');
  process.exit(1);
}

bcrypt
  .hash(password, 12)
  .then((hash) => {
    console.log(hash);
  })
  .catch((error: unknown) => {
    console.error('Failed to hash password:', error);
    process.exit(1);
  });
