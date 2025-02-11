const fetch = require("node-fetch");
const https = require("https");

const url1 = "";
const url2 = "";
const webhookUrl = "";
let interval = 1800;
let waitTime = 35;

let lastIP = null;

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const fetchAndSend = async (url) => {
  try {
    console.log(`Requesting URL: ${url}...`);

    const response = await fetch(url, { agent });
    const text = await response.text();

    const currentIpMatch = text.match(/Current IP:\s*(\d+\.\d+\.\d+\.\d+)/);
    const newIpMatch = text.match(/New IP:\s*(\d+\.\d+\.\d+\.\d+)/);

    if (currentIpMatch && newIpMatch) {
      const currentIp = currentIpMatch[1];
      const newIp = newIpMatch[1];

      const message = {
        content: `Changing IP from last IP (${lastIP || "unknown"}) to new IP (${newIp})`,
      };

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

      lastIP = currentIp;
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
    console.log("Starting cycle...");
    await Promise.all([fetchAndSend(url1), fetchAndSend(url2)]);

    console.log(`Waiting ${waitTime} seconds before next batch of requests...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));

    await Promise.all([fetchAndSend(url1), fetchAndSend(url2)]);

    console.log(`Cycle completed. Waiting ${interval} seconds for the next cycle.`);
  };

  (async () => {
    await executeCycle();
  })();

  setInterval(() => {
    executeCycle();
  }, interval * 1000);
};

startInterval();
