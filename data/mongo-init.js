db.createCollection('users');
db.users.insertOne({
    username: 'superadmin',
    role: 'admin',
    password: '<ganti-dengan-hash>'
});
db.createCollection('audit_log');
db.audit_log.createIndex({ createdAt: 1 });
