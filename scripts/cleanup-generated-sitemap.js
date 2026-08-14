#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

// Static exports generate this file, while server builds use
// pages/sitemap.xml.js. A stale copy makes the next build fail.
const generatedSitemap = path.resolve(process.cwd(), 'public', 'sitemap.xml')

if (fs.existsSync(generatedSitemap)) {
  fs.rmSync(generatedSitemap)
  console.log('[build] removed stale public/sitemap.xml')
}
