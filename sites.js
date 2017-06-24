const https = require('https')
const cheerio = require('cheerio')
const querystring = require('querystring')

const url = 'https://www.recreation.gov/recreationalAreaDetails.do?contractCode=NRSO&parkId=1090&recAreaId=1090&agencyCode=70903'

const getParks = (cb) => {
    https.get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => parseParks(data, cb))
    }).on('error', (err) => console.error(err))
}

const parseParks = (data, cb) => {
    const $ = cheerio.load(data)
    const parkLinks = $('#resvInfoContainer .resvFacilityCardName > a')
    const parks = []
    parkLinks.each((i, e) => {
        const { href, title } = e.attribs
        const query = querystring.parse(href)
        const park = {
            sitesUrl: `https://www.recreation.gov/campsiteSearch.do?search=site&page=siteresult&contractCode=NRSO&parkId=${query.parkId}`,
            name: title,
            id: query.parkId,
            sites: [],
            sitesChecked: 0
        }
        parks.push(park)
    })

    const tally = {
        totalParks: parks.length,
        parksComplete: 0,
        parks
    }

    parks.forEach((park) => getSites(park, tally, cb))
}

const getSites = (park, tally, cb) => {
    https.get(park.sitesUrl, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => parseSites(park, data, tally, cb))
    }).on('err', (err) => console.error(err))
}

const parseSites = (park, data, tally, cb) => {
    const $ = cheerio.load(data)
    const table = $('table#shoppingitems')
    const rows = table.find('tbody tr')
    
    rows.each((i, e) => {
        const row = $(e)
        const anchor = row.find('div.siteListLabel a')[0]
        const site = {
            id: querystring.parse(anchor.attribs.href).siteId,
            number: anchor.children[0].data
        }
        park.sites.push(site)
    })
    tally.parksComplete++

    if (tally.parksComplete === tally.totalParks) 
        cb(tally.parks)
}

module.exports.getParks = getParks