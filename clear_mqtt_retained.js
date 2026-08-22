/**
 * clear_mqtt_retained.js
 * 
 * Script untuk membersihkan retained messages di MQTT broker BMKG.
 * Jalankan SATU KALI sebelum mengaktifkan ulang workflow N8N.
 * 
 * Install: npm install mqtt
 * Jalankan: node clear_mqtt_retained.js
 */

const mqtt = require('mqtt');

const BROKER_URL = 'mqtt://202.90.198.159:1883';
const OPTIONS = {
    username: 'bmkg_aws',
    password: 'bmkg_aws123',
    clientId: 'cleaner_' + Math.random().toString(16).substring(2, 8),
    clean: true,
    connectTimeout: 10000,
};

// Topic wildcard yang sama dengan N8N workflow Anda
const TOPICS = [
    'device/+/data/+/+/MQTT_Table/cj',
    'device/+/data/+/MQTT_Table/cj'
];

console.log('🔌 Menghubungkan ke MQTT broker:', BROKER_URL);

const client = mqtt.connect(BROKER_URL, OPTIONS);

let retainedCount = 0;
let clearedCount = 0;
const seenTopics = new Set();

client.on('connect', () => {
    console.log('✅ Terhubung ke broker!');
    console.log('🔍 Mencari retained messages...');
    console.log('   (Akan otomatis selesai dalam 30 detik)\n');

    // Subscribe ke semua topic yang digunakan workflow
    TOPICS.forEach(topic => {
        client.subscribe(topic, { qos: 0 }, (err) => {
            if (err) console.error('❌ Gagal subscribe:', topic, err.message);
            else console.log('📡 Subscribed:', topic);
        });
    });

    // Setelah 30 detik, anggap sudah menerima semua retained messages
    setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Hasil:`);
        console.log(`   Retained messages ditemukan: ${retainedCount}`);
        console.log(`   Retained messages dibersihkan: ${clearedCount}`);
        console.log(`   Unique topics: ${seenTopics.size}`);
        console.log('='.repeat(50));
        console.log('\n✅ Selesai! Sekarang aman untuk mengaktifkan N8N workflow.');
        client.end();
        process.exit(0);
    }, 30000);
});

client.on('message', (topic, message, packet) => {
    // Hanya proses retained messages
    if (packet.retain) {
        retainedCount++;
        seenTopics.add(topic);

        console.log(`🗑️  Clearing retained: ${topic} (${message.length} bytes)`);

        // Publish empty payload dengan retain=true untuk menghapus retained message
        client.publish(topic, '', { retain: true, qos: 0 }, (err) => {
            if (!err) {
                clearedCount++;
            } else {
                console.error(`   ❌ Gagal clear: ${topic}`, err.message);
            }
        });
    }
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err.message);
});

client.on('offline', () => {
    console.log('⚠️  Koneksi terputus, mencoba reconnect...');
});

