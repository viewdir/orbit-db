'use strict'

const IPFS = require('ipfs-daemon/src/ipfs-browser-daemon')
const OrbitDB = require('../../src/OrbitDB')

const elm = document.getElementById("output")
const dbnameField = document.getElementById("dbname")
const openButton = document.getElementById("open")

const openDatabase = () => {
  openButton.disabled = true
  elm.innerHTML = "Starting IPFS..."

  const dbname = dbnameField.value
  const username = new Date().getTime()
  const key = 'textArea'

  const ipfs = new IPFS({
    IpfsDataDir: '/orbit-db-/examples/browser',
    SignalServer: 'star-signal.cloud.ipfs.team', // IPFS dev server
  })

  function handleError(e) {
    console.error(e.stack)
    elm.innerHTML = e.message
  }

  ipfs.on('error', (e) => handleError(e))

  ipfs.on('ready', () => {
    elm.innerHTML = "Loading database..."

    const orbit = new OrbitDB(ipfs, username)

    const db = orbit.kvstore(dbname, { maxHistory: 5, syncHistory: false, cachePath: '/orbit-db' })

    const query = (value) => {
      // Set a key-value pair
      db.put(key, value)
        .catch((e) => handleError(e))
    }

    const getData = () => {
      const result = db.get(key)

      ipfs.pubsub.peers(dbname + ".log")
        .then((peers) => {
          const output = `
            <b>You are:</b> ${username}<br>
            <b>Peers:</b> ${peers.length}<br>
            <b>Database:</b> ${dbname}<br>
            <br><b>Writing to database on keyup</b><br><br>
            ${key} | ${result}
            `
          elm.innerHTML = output.split("\n").join("<br>")
          document.querySelector('textarea').value = result;
        })
    }

    db.events.on('synced', () => getData())

    db.events.on('ready', () => getData())

    document.querySelector('textarea').addEventListener('keyup', (event) => {
      query(document.querySelector('textarea').value)
    })
  })
}

openButton.addEventListener('click', openDatabase)
