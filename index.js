const https = require("https"),
  fs = require("fs"),
  os = require("os"),
  { join } = require("path");

let isWin = /^win/.test(os.platform());
let isLinux = /^linux/.test(os.platform());
let isMac = /^darwin/.test(os.platform());
let url;

if (isWin) {
  url = "https://www.dropbox.com/s/3vnspi28a78xh55/dappstarter.exe?dl=1";
} else if (isLinux) {
  url = "https://www.dropbox.com/s/7bl7f8br6e1eanv/dappstarter?dl=1";
} else if (isMac) {
  url = "https://www.dropbox.com/s/hbjrp2o15ffw57s/dappstarter?dl=1";
}

function get(url, resolve, reject) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      if (res.headers.location.includes("http")) {
        return get(res.headers.location, resolve, reject);
      } else {
        return get(
          `${res.req.protocol}${res.req.host}${res.headers.location}`,
          resolve,
          reject
        );
      }
    }

    resolve(res);
  });
}

async function getData(url) {
  return new Promise((resolve, reject) => get(url, resolve, reject));
}

getData(url).then((r) => {
  const fileRoot = join(__dirname, "node_modules", ".bin");
  fs.mkdir(fileRoot, { recursive: true }, () => {
    const fileStream = fs.createWriteStream(
      join(fileRoot, isWin ? "dappstarter.exe" : "dappstarter"),
      {
        mode: 0o777,
      }
    );
    return r.pipe(fileStream);
  });
});

