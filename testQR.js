const QRCode = require('qrcode')

async function testQRCode() {
  // Test URL - the short URL that should be encoded in the QR
  const shortUrl = 'http://localhost:5000/Ws0AIFWlZ'
  
  console.log('Testing QR code generation...')
  console.log('URL to encode:', shortUrl)
  
  try {
    const qrImage = await QRCode.toDataURL(shortUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#1976d2',
        light: '#f8f9fa'
      }
    })
    
    console.log('✓ QR code generated successfully')
    console.log('QR code data URL length:', qrImage.length)
    console.log('\nHow it works:')
    console.log('1. User scans the QR code with their phone')
    console.log('2. Phone opens URL:', shortUrl)
    console.log('3. Server receives request to /:shortUrl endpoint')
    console.log('4. Server looks up "Ws0AIFWlZ" in database')
    console.log('5. Server finds full URL and redirects there')
    console.log('6. User is taken to the target URL (e.g., YouTube link)')
    console.log('7. Clicks counter increments')
    process.exit(0)
  } catch (err) {
    console.error('Error generating QR code:', err)
    process.exit(1)
  }
}

testQRCode()
