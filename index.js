const { getParks } = require('./sites')
const { checkAvailability } = require('./availability')

const printDates = (d) => d.each((i, e) => {
    console.log(`${e.date.toDateString()}: ${e.available ? "Available" : "Reserved"}`)
})

const y = process.argv.findIndex(a => a === '-y')
const m = process.argv.findIndex(a => a === '-m')
const d = process.argv.findIndex(a => a === '-d')
const l = process.argv.findIndex(a => a === '-l')

if (y === -1 || m === -1 || d === -1 || l === -1) {
    printUsage()
    process.exit(1)
}

const year = process.argv[y + 1]
const month = process.argv[m + 1]
const day = process.argv[d + 1]
const lengthOfStay = process.argv[l + 1]

const dateString = `${month}/${day}/${year}`
const arrivalDate = new Date(dateString)

getParks((parks) => {
    parks.forEach((park) => {
        park.sites.forEach((site) => {
            checkAvailability(arrivalDate, lengthOfStay, park.id, site.id, (dates) => {
                console.log(`Park: ${park.name}, Site number: ${site.number}`)
                printDates(dates)
            })
        })
    })
})

function printUsage() {
    console.log('usage: campsearch -y <year> -m <month> -d <day> -l <length of stay>')
}