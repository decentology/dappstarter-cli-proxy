#!/usr/bin/env node
const { get } = require("https"),
  { createWriteStream, mkdir, stat } = require("fs"),
  { platform } = require("os"),
  { join } = require("path");

let isWin = /^win/.test(platform());
let isLinux = /^linux/.test(platform());
let isMac = /^darwin/.test(platform());
const fileRoot = join(__dirname, "node_modules", ".bin");
const filePath = join(fileRoot, isWin ? "dappstarter.exe" : "dappstarter");
let url;

if (isWin) {
  url = "https://www.dropbox.com/s/3vnspi28a78xh55/dappstarter.exe?dl=1";
} else if (isMac) {
  url = "https://www.dropbox.com/s/hbjrp2o15ffw57s/dappstarter?dl=1";
} else if (isLinux) {
  url = "https://www.dropbox.com/s/7bl7f8br6e1eanv/dappstarter?dl=1";
} else {
  throw new Error(`Operating system not supported. ${platform()}`);
}

function getUrl(url, resolve, reject) {
  get(url, (res) => {
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
  });
}

async function getData(url) {
  return new Promise((resolve, reject) => getUrl(url, resolve, reject));
}

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
