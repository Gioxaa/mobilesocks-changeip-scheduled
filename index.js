const fetch = require("node-fetch");
const https = require("https");

const url1 = "";
const url2 = "";
const webhookUrl = "";
let interval = 1800; // Interval utama dalam detik
let waitTime = 35; // Waktu tunggu antar request dalam detik

let lastIP = null;

// Membuat custom agent untuk menonaktifkan validasi SSL
const agent = new https.Agent({
  rejectUnauthorized: false, // Menonaktifkan verifikasi sertifikat SSL
});

const fetchAndSend = async (url) => {
  try {
    console.log(`Requesting URL: ${url}...`);

    // Mengirimkan request ke URL dengan custom agent
    const response = await fetch(url, { agent });
    const text = await response.text();

    // Parsing IP dari respons
    const currentIpMatch = text.match(/Current IP:\s*(\d+\.\d+\.\d+\.\d+)/);
    const newIpMatch = text.match(/New IP:\s*(\d+\.\d+\.\d+\.\d+)/);

    if (currentIpMatch && newIpMatch) {
      const currentIp = currentIpMatch[1];
      const newIp = newIpMatch[1];

      // Membuat pesan untuk Discord webhook
      const message = {
        content: `Changing IP from last IP (${lastIP || "unknown"}) to new IP (${newIp})`,
      };

      // Mengirimkan ke Discord webhook
      const discordResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (!discordResponse.ok) {
        console.error("Failed to send message to Discord");
      } else {
        console.log(`Success: Sent message to Discord. New IP: ${newIp}`);
      }

      lastIP = currentIp; // Menyimpan IP terakhir
    } else {
      console.error("Failed to parse IPs from response.");
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

const startInterval = () => {
  console.log(`Script started. Sending requests every ${interval} seconds.`);
  const executeCycle = async () => {
    // Request pertama ke url1 dan url2 secara paralel
    console.log("Starting cycle...");
    await Promise.all([fetchAndSend(url1), fetchAndSend(url2)]);

    // Tunggu waitTime detik
    console.log(`Waiting ${waitTime} seconds before next batch of requests...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));

    // Request kedua ke url1 dan url2 secara paralel
    await Promise.all([fetchAndSend(url1), fetchAndSend(url2)]);

    // Log selesai
    console.log(`Cycle completed. Waiting ${interval} seconds for the next cycle.`);
  };

  // Jalankan siklus pertama langsung
  (async () => {
    await executeCycle(); // Menjalankan langsung saat pertama kali script dijalankan
  })();

  // Jalankan siklus berikutnya sesuai interval
  setInterval(() => {
    executeCycle();
  }, interval * 1000); // Interval utama dalam milidetik
};

startInterval();
