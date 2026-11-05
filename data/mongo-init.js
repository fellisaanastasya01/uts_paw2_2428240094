// Bootstrap MongoDB sederhana: super admin + log audit untuk collection apapun.
// Jalankan: mongosh "mongodb://127.0.0.1:27017/toko_gadget" data/mongo-init.js
db.createCollection('users');
db.users.insertOne({
    username: 'superadmin',
    role: 'admin',
    password: '<ganti-dengan-hash>'
});
db.createCollection('audit_log');
db.audit_log.createIndex({ createdAt: 1 });
