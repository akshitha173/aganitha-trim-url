const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')

mongoose.connect('mongodb+srv://user1:navo%401234@aksh.4s33zs8.mongodb.net/?appName=aksh', {
  useNewUrlParser: true, useUnifiedTopology: true
})

async function main() {
  try {
    const all = await ShortUrl.find()
    console.log(`Total URLs in database: ${all.length}`)
    all.forEach(url => {
      console.log(`- ${url.short}: ${url.full} | QR: ${url.qrImage ? 'YES' : 'NO'}`)
    })
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
