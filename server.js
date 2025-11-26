const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')
const QRCode = require('qrcode')
const app = express()

mongoose.connect('mongodb+srv://user1:navo%401234@aksh.4s33zs8.mongodb.net/?appName=aksh', {
  useNewUrlParser: true, useUnifiedTopology: true
})

app.set('view engine', 'ejs')
// Ensure views and static assets are resolved relative to this file,
// not the current working directory. This prevents missing CSS when
// the server is started from a different folder.
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// Serve static assets (CSS, JS, images) from the `public` directory
// located next to this server file.
app.use(express.static(path.join(__dirname, 'public')))

// Helper function to generate QR code as base64 data URL
async function generateQRCode(url) {
  try {
    console.log('Generating QR code for:', url)
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
    console.log('QR code generated successfully, length:', qrImage.length)
    return qrImage
  } catch (err) {
    console.error('Error generating QR code:', err)
    return null
  }
}

app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find().sort({ createdAt: -1 })
  res.render('index', { shortUrls: shortUrls, error: req.query.error || null, baseUrl: process.env.BASE_URL || '' })
})

// Health endpoint for autograding / monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// /healthz endpoint (explicit requirement)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Simple JSON API endpoints
app.get('/api/shortUrls', async (req, res) => {
  const shortUrls = await ShortUrl.find()
  res.json(shortUrls)
})

app.post('/api/shortUrls', async (req, res) => {
  if (!req.body || !req.body.full) return res.status(400).json({ error: 'full URL required' })
  try {
    const obj = { full: req.body.full }
    if (req.body.short) obj.short = req.body.short
    
    console.log('API: Creating short URL:', obj)
    // Create the short URL first to get the generated short code
    const created = await ShortUrl.create(obj)
    console.log('API: Short URL created, ID:', created._id, 'Short:', created.short)
    
    // Generate QR code for the TARGET URL (not the short URL)
    console.log('API: Generating QR code for target URL:', created.full)
    const qrImage = await generateQRCode(created.full)
    
    // Update with QR code
    if (qrImage) {
      console.log('API: Saving QR code to database')
      created.qrImage = qrImage
      await created.save()
      console.log('API: QR code saved successfully')
    } else {
      console.warn('API: QR code generation returned null')
    }
    
    res.status(201).json(created)
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: 'short code already in use' })
    console.error('API: Error creating short URL:', err)
    res.status(500).json({ error: 'internal error' })
  }
})

app.delete('/api/shortUrls/:id', async (req, res) => {
  const deleted = await ShortUrl.findByIdAndDelete(req.params.id)
  if (!deleted) return res.sendStatus(404)
  res.sendStatus(204)
})

app.post('/shortUrls', async (req, res) => {
  try {
    const obj = { full: req.body.fullUrl }
    if (req.body.customCode && req.body.customCode.trim() !== '') obj.short = req.body.customCode.trim()
    
    console.log('Creating short URL:', obj)
    const created = await ShortUrl.create(obj)
    console.log('Short URL created, ID:', created._id, 'Short:', created.short)
    
    // Generate QR code for the TARGET URL (not the short URL)
    console.log('Generating QR code for target URL:', created.full)
    const qrImage = await generateQRCode(created.full)
    
    // Update with QR code
    if (qrImage) {
      console.log('Saving QR code to database')
      created.qrImage = qrImage
      await created.save()
      console.log('QR code saved successfully')
    } else {
      console.warn('QR code generation returned null')
    }
    
    res.redirect('/')
  } catch (err) {
    // handle duplicate short code
    if (err && err.code === 11000) return res.redirect('/?error=custom_taken')
    console.error('Error creating short URL:', err)
    res.redirect('/?error=server_error')
  }
})

// delete via form (HTML forms don't support DELETE)
app.post('/shortUrls/:id/delete', async (req, res) => {
  await ShortUrl.findByIdAndDelete(req.params.id)
  res.redirect('/')
})

app.get('/:shortUrl', async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
    if (shortUrl == null) {
      console.log('Short URL not found:', req.params.shortUrl)
      return res.sendStatus(404)
    }

    // Update clicks and lastClicked atomically
    const updated = await ShortUrl.findByIdAndUpdate(
      shortUrl._id,
      {
        $inc: { clicks: 1 },
        $set: { lastClicked: new Date() }
      },
      { new: true }
    )

    console.log('Updated short URL:', updated.short, 'clicks:', updated.clicks, 'lastClicked:', updated.lastClicked)
    res.redirect(updated.full)
  } catch (err) {
    console.error('Error in redirect:', err)
    res.sendStatus(500)
  }
})

// Start server and provide clearer logs and error handling for port conflicts
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (pid ${process.pid})`)
})

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the other process or set a different PORT.`)
    process.exit(1)
  }
  console.error('Server error:', err)
  process.exit(1)
})

// Test endpoint to validate all requirements
app.get('/test', async (req, res) => {
  const results = {
    passed: [],
    failed: []
  }

  try {
    // 1. Check /healthz returns 200
    const healthRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/healthz')
    if (healthRes.status === 200) {
      results.passed.push('✓ /healthz returns 200')
    } else {
      results.failed.push('✗ /healthz returned ' + healthRes.status)
    }

    // 2. Create a link
    const createRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/shortUrls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full: 'https://example.com/test' })
    })
    if (createRes.status === 201) {
      results.passed.push('✓ Creating a link returns 201')
    } else {
      results.failed.push('✗ Creating a link returned ' + createRes.status)
    }

    // Get the created link
    const created = await createRes.json()
    const testCode = created.short

    // 3. Duplicate code returns 409
    const dupRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/shortUrls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full: 'https://example.com/other', short: testCode })
    })
    if (dupRes.status === 409) {
      results.passed.push('✓ Duplicate codes return 409')
    } else {
      results.failed.push('✗ Duplicate codes returned ' + dupRes.status)
    }

    // 4. Redirect works and increments clicks
    const beforeClicksRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/shortUrls')
    const allBefore = await beforeClicksRes.json()
    const linkBefore = allBefore.find(l => l.short === testCode)
    const clicksBefore = linkBefore ? linkBefore.clicks : 0

    // Trigger redirect (follow: false to not actually redirect)
    await fetch('http://localhost:' + (process.env.PORT || 5000) + '/' + testCode, { redirect: 'manual' })

    // Check clicks incremented
    const afterClicksRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/shortUrls')
    const allAfter = await afterClicksRes.json()
    const linkAfter = allAfter.find(l => l.short === testCode)
    const clicksAfter = linkAfter ? linkAfter.clicks : 0

    if (clicksAfter > clicksBefore) {
      results.passed.push('✓ Redirect works and increments click count')
    } else {
      results.failed.push('✗ Redirect did not increment clicks')
    }

    // 5. Deletion stops redirect (404)
    const deleteRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/shortUrls/' + linkAfter._id, {
      method: 'DELETE'
    })
    if (deleteRes.status === 204) {
      results.passed.push('✓ Deletion returns 204')
    } else {
      results.failed.push('✗ Deletion returned ' + deleteRes.status)
    }

    // Try to access deleted link
    const deletedAccessRes = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/' + testCode, { redirect: 'manual' })
    if (deletedAccessRes.status === 404) {
      results.passed.push('✓ Deleted link returns 404')
    } else {
      results.failed.push('✗ Deleted link returned ' + deletedAccessRes.status)
    }

  } catch (err) {
    results.failed.push('✗ Test error: ' + err.message)
  }

  res.json({
    summary: results.passed.length + ' passed, ' + results.failed.length + ' failed',
    results: results
  })
})