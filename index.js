const { getParks } = require('./sites')
const { checkAvailability } = require('./availability')

const y = process.argv.findIndex(a => a === '-y')
const m = process.argv.findIndex(a => a === '-m')
const d = process.argv.findIndex(a => a === '-d')

if (y === -1 || m === -1 || d === -1) {
    printUsage()
    process.exit(1)
}

const year = process.argv[y + 1]
const month = process.argv[m + 1]
const day = process.argv[d + 1]
const lengthOfStay = 3

const dateString = `${month}/${day}/${year}`
const arrivalDate = new Date(dateString)

getParks((parks) => {
    let parksChecked = 0
    parks.forEach((park) => {
        park.sites.forEach((site) => {
            checkAvailability(arrivalDate, lengthOfStay, park.id, site.id, (dates) => {
                site.dates = dates
                if (park.sites.length === ++park.sitesChecked && parks.length === ++parksChecked) {
                    print(parks)
                }
            })
        })
    })
})

function print(parks) {
    const dates = parks[0].sites[0].dates.map(d => {
        const lds = d.date.toLocaleDateString('en-US')
        return lds.substring(0, lds.length - 5)
    })
    const dateHeader = dates.join('\t')
    parks.forEach(park => {
        console.log(`Park: ${park.name}`)
        console.log(`Site #\t${dateHeader}`)
        park.sites.forEach(site => {
            const dates = site.dates.map(a => a.available ? "Avail" : "Res").join('\t')
            console.log(`${site.number.substring(0, 6)}\t${dates}`)
        })
        console.log('')
    })
}

function printUsage() {
    console.log('usage: campsearch -y <year> -m <month> -d <day>')
}