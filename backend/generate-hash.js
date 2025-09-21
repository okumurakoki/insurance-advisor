const bcrypt = require('bcryptjs');

const password = 'password123';
const rounds = 12;

bcrypt.hash(password, rounds, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to update all demo users:');
    console.log(`UPDATE prudential_users SET password_hash = '${hash}' WHERE username IN ('admin', 'demo_agency', 'demo_staff');`);
});