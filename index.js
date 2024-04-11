/* eslint-disable no-console */

import { unixfs } from '@helia/unixfs'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'
import { createHelia } from 'helia'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise' // for encrypting connections
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from '@libp2p/identify'
// Block Store to store DHT data
const blockstore = new FsBlockstore('block-store')
const datastore = new FsDatastore('data-store')


// libp2p is the networking layer that underpins Helia
// const libp2p = await createLibp2p()

// create a Helia node
const helia = await createHelia({
    datastore,
    blockstore,
    libp2p: {
    datastore,
    blockstore,
    addresses: {
      listen: [
        // add a listen address (localhost) to accept TCP connections on a random port
        '/ip4/127.0.0.1/tcp/0'
      ]
    },
    transports: [
      tcp()
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    peerDiscovery: [
      bootstrap({
        list: [
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
            ]
      })
    ],
    services: {
      identify: identify()
    }
}


})

// create a filesystem on top of Helia, in this case it's UnixFS
const fs = unixfs(helia)

// we will use this TextEncoder to turn strings into Uint8Arrays
const encoder = new TextEncoder()

// add the bytes to your node and receive a unique content identifier
const cid = await fs.addBytes(encoder.encode('Hello World 201'))

console.log('Added file:', cid.toString())

// create a second Helia node using the same blockstore
const helia2 = await createHelia({
  // libp2p,
    datastore,
  blockstore
})

console.log(`Node started with id ${helia.libp2p.peerId.toString()}`)

// create a second filesystem
const fs2 = unixfs(helia2)

// this decoder will turn Uint8Arrays into strings
const decoder = new TextDecoder()
let text = ''

// read the file from the blockstore using the second Helia node
for await (const chunk of fs2.cat(cid)) {
  text += decoder.decode(chunk, {
    stream: true
  })
}

console.log('Added file contents:', text)
