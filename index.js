#!/usr/bin/env node
const { get } = require("https"),
  { createWriteStream, mkdir, stat } = require("fs"),
  { platform } = require("os"),
  { join } = require("path");

let isWin = /^win/.test(platform());
let isLinux = /^linux/.test(platform());
let isMac = /^darwin/.test(platform());
const fileRoot = join(process.cwd(), "node_modules", ".bin");
const filePath = join(fileRoot, isWin ? "dappstarter.exe" : "dappstarter");

// Get latest release browser_download_url
async function getLatestRelease() {
  const stream = await getData(
    "https://api.github.com/repos/decentology/dappstarter-cli/releases"
  );
  const content = await streamToString(stream);
  let json = null;
  try {
    json = JSON.parse(content);
  } catch (error) {
    console.error(
      "Unable to parse json from Github releases https://api.github.com/repos/decentology/dappstarter-cli/releases"
    );
  }
  const latestRelease = json[0];
  const downloadUrls = latestRelease.assets.map((x) => x.browser_download_url);
  const downloadUrl = downloadUrls.find((x) =>
    x.includes(isWin ? "win" : isLinux ? "linux" : "mac")
  );
  if (downloadUrl == null) {
    throw new Error(`Operating system not supported. ${platform()}`);
  }
  return downloadUrl;
}

(async () => {
  const url = await getLatestRelease();
  stat(filePath, (err, stats) => {
    if (err) {
      getData(url).then((r) => {
        mkdir(fileRoot, { recursive: true }, () => {
          const fileStream = createWriteStream(filePath, {
            mode: 0o700,
          });
          return r.pipe(fileStream);
        });
      });
    }
  });
})();

function getUrl(url, resolve, reject) {
  get(
    url,
    {
      headers: {
        "User-Agent": "Node.js",
      },
    },
    (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location.includes("http")) {
          return getUrl(res.headers.location, resolve, reject);
        } else {
          return getUrl(
            `${res.req.protocol}${res.req.host}${res.headers.location}`,
            resolve,
            reject
          );
        }
      }

      resolve(res);
    }
  );
}

async function getData(url) {
  return new Promise((resolve, reject) => getUrl(url, resolve, reject));
}

async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
