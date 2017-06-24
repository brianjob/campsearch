const zlib = require('zlib')
const https = require('https')
const querystring = require('querystring')
const cheerio = require('cheerio')

const checkAvailability = (arrivalDate, lengthOfStay, parkId, siteId, cb) => {
    const camparea = 83794000 // get from arg

    const dateToday = new Date()
    const dateMinWindow = new Date()
    dateMinWindow.setDate(arrivalDate.getDate() - 7)
    const dateMaxWindow = new Date()
    dateMaxWindow.setDate(arrivalDate.getDate() + 356)

    const form = {
        contractCode: 'NRSO',
        parkId,
        siteId,
        camparea,
        selStatus: 'selStatus',
        matrixHasError: true,
        dateToday: dateToday.toLocaleDateString('en-US'),
        currentMaximumWindow: 12,
        dateMinWindow: dateMinWindow.toLocaleDateString('en-US'), // 6/26/2017
        dateMaxWindow: dateMaxWindow.toLocaleDateString('en-US'), // 6/22/2018
        arvdate: arrivalDate.toLocaleDateString('en-US'),// 7/3/2017
        arrivaldate: arrivalDate.toDateString().split(' ').join('+'),
        lengthOfStay,
        dateChosen: false
    }

    const postData = querystring.stringify(form)

    const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.8',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Host': 'www.recreation.gov',
        'Origin': 'www.recreation.gov',
        'Referer': 'https://www.recreation.gov/campsiteDetails.do?contractCode=NRSO&siteId=3942&parkId=70235',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Content-Length': Buffer.byteLength(postData),
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const options = {
        method: 'POST',
        host: 'www.recreation.gov',
        path: '/campsiteDetails.do',
        headers
    }

    const handleResponse = (err, data) => {
        if (err) {
            console.error(err)
            return
        }

        const $ = cheerio.load(data.toString())
        const calendar = $('table#calendar > tbody > tr:nth-of-type(1) > td')
        const dates = calendar.map((index, element) => {
            const date = new Date(arrivalDate)
            date.setDate(arrivalDate.getDate() + index)
            return {
                date,
                available: element.attribs.title === 'Available'
            }
        }).toArray()

        cb(dates)
    }

    const req = https.request(options, (res) => {
        const chunks = []
        res.on('data', (chunk) => {
            chunks.push(chunk)
        })
        res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            zlib.gunzip(buffer, handleResponse)
        })
    })

    req.on('error', (err) => {
        console.error(`error making request: ${err}`)
    })

    req.write(postData)
    req.end()
}

module.exports = { checkAvailability }