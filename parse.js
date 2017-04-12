import htmlparser from 'htmlparser2'
import fs from 'fs'

let isNumber = false
let thStart = false
let tdStart = false
let thString = ''
let csvRow = []
let textLine = ''
let lastThString = ''
const parser = new htmlparser.Parser({
  onopentag: function(name, attribs){
    if (name === 'th') {
      thStart = true
    }
  },
  ontext: function(text) {
    if (thStart) {
      text = text.trim()
      thString += text
    }

    if (tdStart) {
      text = text.trim()
      if (isNumber) {
        text = text.replace(/[^0-9]/g, '')
      }

      text = text.replace(',', '，')

      textLine = textLine + text
      textLine = textLine.trim()
    }
  },
  onclosetag: function(tagname){
    if (tagname === 'th' && thStart) {
      thStart = false
      switch(thString) {
        case '機關名稱':
        case '招標方式':
        case '決標方式':
        case '標案名稱':
          // case '原公告日期':
        case '得標廠商':
        case '決標日期':
          isNumber = false
          tdStart = true
          break
        case '預算金額':
        case '決標金額(不含固定費用金額)':
        case '得標廠商原始投標金額':
        case '決標金額(含招標文件載明之固定費用金額)':
          tdStart = true
          isNumber = true
          break
        default:
          tdStart = false
          break
      }
      lastThString = thString
      thString = ''
    }

    if (tagname === 'td' && tdStart) {
      csvRow.push(lastThString + ':' + textLine)
      textLine = ''
      tdStart = false
    }
  }
});

function formatCsvRow(csvRow) {
  const fields = [ '機關名稱:', '招標方式:', '決標方式:', '標案名稱:', '決標日期:', '預算金額:']
  const repeatedFields = [ '得標廠商:', '決標金額(不含固定費用金額):', '得標廠商原始投標金額:' ,'決標金額(含招標文件載明之固定費用金額):' ]

  const repeatedArr = []
  const arr = []

  csvRow.forEach((cell) => {
    repeatedFields.forEach((field) => {
      if (cell.indexOf(field) > -1) {
        repeatedArr.push(cell)
      }
    })
  })

  fields.forEach((field, index) => {
    let isChecked = false
    csvRow.every((cell) => {
      if (cell.indexOf(field) > -1) {
        cell = cell.replace(field, '')
        if (field === '決標日期:') {
          const pos = cell.indexOf('/');
          if (pos > -1) {
            let year = cell.substring(0, pos)
            year = parseInt(year) + 1911
            cell = year + cell.substring(pos, cell.length)
          }
        }
        arr.push(cell)
        isChecked = true
        return false
      }
      return true
    })
    if (!isChecked) {
      arr.push('')
    }
  })

  return arr.concat(repeatedArr)
}

(function main() {
  const folder = './results'
  fs.readdir(folder, (err, files) => {
    files.reduce((p, file) => {
      csvRow = []
      const html = fs.readFileSync(`${folder}/${file}`, 'utf-8')
      parser.write(html)
      fs.writeFileSync('./output.csv', formatCsvRow(csvRow).toString() + ',' + file + '\r\n', {
        encoding: 'utf-8',
        flag: 'a'
      })
    }, Promise.resolve())
  })
})()
