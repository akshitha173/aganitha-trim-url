const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')
const QRCode = require('qrcode')

mongoose.connect('mongodb+srv://user1:navo%401234@aksh.4s33zs8.mongodb.net/?appName=aksh', {
  useNewUrlParser: true, useUnifiedTopology: true
})

async function generateQRCode(url) {
  try {
    const qrImage = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#1976d2',
        light: '#f8f9fa'
      }
    })
    return qrImage
  } catch (err) {
    console.error('Error generating QR code:', err)
    return null
  }
}

async function main() {
  try {
    const shortUrls = await ShortUrl.find()
    console.log(`Found ${shortUrls.length} total URLs`)

    for (const url of shortUrls) {
      // Generate QR code for the TARGET URL (full URL)
      console.log(`Generating QR for target URL: ${url.full}`)
      
      const qrImage = await generateQRCode(url.full)
      if (qrImage) {
        url.qrImage = qrImage
        await url.save()
        console.log(`✓ Updated QR for ${url.short} -> ${url.full}`)
      } else {
        console.log(`✗ Failed to generate QR for ${url.short}`)
      }
    }

    console.log('Done! All QR codes now point directly to target URLs')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()

