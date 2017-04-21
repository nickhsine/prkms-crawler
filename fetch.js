import request from 'request-promise'
import fs from 'fs'
import qs from 'qs'
import sleep from 'sleep'

const querySentence = '其他服務'

const timeRanges = [ process.argv[2] ]

console.log(timeRanges)

function fetchByUrlAndSave(url) {
  return new Promise((resolve, reject) => {
    console.log('fetchByUrlAndSave by url:', url)
    const options = {
      url: url,
      method: 'GET'
    }
    request(options)
      .then((response) => {
	const urlObj = qs.parse(url)
        if (typeof urlObj !== 'object' || !urlObj.tenderCaseNo || !urlObj.pkAtmMain) {
          resolve()
          return
        }
        const filename = `pkAtmMain=${urlObj.pkAtmMain}&tenderCaseNo=${urlObj.tenderCaseNo}`
	
        fs.writeFile('results/' + filename, response, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
  })
}

function fetchByUrls(urls) {
  return urls.reduce((p, url) => {
    return p.then(() => {
      sleep.sleep(2)
      return fetchByUrlAndSave(url)
    })
  }, Promise.resolve())
}

function fetchByTimeRanges() {
  timeRanges.reduce((p, timeRange) => {
    return p.then(() => {
      sleep.sleep(10)
      return fetchByTimeRange(timeRange)
    })
  }, Promise.resolve())
}

function fetchByTimeRange(timeRange) {
  console.log('fetchByTimeRange by timeRange:', timeRange)

  let totalItems = 0
  const itemPerPage = 10

  function fetchByPage(page) {
    const query = {
      timeRange: timeRange,
      querySentence: querySentence,
      sortCol: "TENDER_NOTICE_DATE",
      tenderStatusType: '決標',
      sym: 'on',
      itemPerPage: itemPerPage,
    }

    console.log('fetchByPage by page:', page)

    query['d-7095067-p'] = page

    const options = {
      url: 'https://web.pcc.gov.tw/prkms/prms-searchBulletionClient.do?' + qs.stringify(query),
      method: 'GET'
    }


    return new Promise((resolve, reject) => {
      request(options).then((response) => {
        if (typeof response == 'string') {
          let matches = response.match(/<font color="red"><b>(.+?)<\/b><\/font>筆資料/)
          totalItems = matches[1]
          totalItems = totalItems.replace(',', '')
          totalItems = parseInt(totalItems)

          matches = response.match(/<a href="(\/tps\/main\/pms\/tps\/atm.*?)">/g)
          matches = matches.map((match) => {
            const result = /<a href="(.+?)">/.exec(match)
            return 'https://web.pcc.gov.tw' + result[1]
          })

          sleep.sleep(5)

          fetchByUrls(matches)
            .then(() => {
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        }
      },(error) => {
        reject(error);
      })
    })
  }

  let startPage = parseInt(process.argv[3])
  let totalPage = 0
  return fetchByPage(startPage)
    .then(() => {
      totalPage = Math.ceil(totalItems / itemPerPage)
      const pages = []
      for (let i = startPage + 1; i <= totalPage; i++) {
        pages.push(i)
      }

      return pages.reduce((p, page, index) => {
        return p.then(() => {
          sleep.sleep(5)
          return fetchByPage(page)
        }).catch((error) => {
          console.warn('error:', error)
        })
      }, Promise.resolve())
    })
    .catch((error) => {
      console.warn('fetchByPage error:', error.toString())
    })
}


(function main() {
  fetchByTimeRanges()
})()
