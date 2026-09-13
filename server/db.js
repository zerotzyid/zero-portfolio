import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = process.env.DB_PATH || path.resolve('data/db.json')
const MONGO_URI = process.env.MONGODB_URI || ''
const MONGO_DB = process.env.MONGODB_DB || 'zero-portfolio'

export const SINGLE = new Set(['site', 'profile'])
export const COLLECTIONS = ['site', 'profile', 'projects', 'experiments', 'skills', 'experience', 'links', 'messages', 'uploads', 'sessions']

let mongo = null // { client, db }
let memCache = null

function readJsonFile() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch {
    return null
  }
}

function writeJsonFile(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, DB_PATH)
}

async function mongoConnect() {
  if (mongo || !MONGO_URI) return mongo
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  mongo = { client, db: client.db(MONGO_DB) }
  // seed kosong -> import dari JSON
  const seed = readJsonFile()
  for (const c of COLLECTIONS) {
    const count = await mongo.db.collection(c).countDocuments()
    if (count === 0 && seed && seed[c] !== undefined) {
      if (SINGLE.has(c)) await mongo.db.collection(c).insertOne({ _key: 'single', ...seed[c] })
      else if (Array.isArray(seed[c]) && seed[c].length) await mongo.db.collection(c).insertMany(seed[c].map(d => ({ ...d })))
    }
  }
  return mongo
}

export function usingMongo() { return Boolean(MONGO_URI) }

export async function store() {
  if (MONGO_URI) {
    try { await mongoConnect() } catch (e) { console.error('Mongo connect gagal, fallback JSON:', e.message) }
  }
  if (mongo) return { kind: 'mongo', db: mongo.db }
  if (!memCache) memCache = readJsonFile() || {}
  return { kind: 'json', db: memCache }
}

export async function persist() {
  if (memCache) writeJsonFile(memCache)
}

// ---- generic ops ----
export async function getSingle(coll) {
  const s = await store()
  if (s.kind === 'mongo') {
    const doc = await s.db.collection(coll).findOne({ _key: 'single' })
    if (doc) { delete doc._id; delete doc._key; return doc }
    return {}
  }
  return s.db[coll] || {}
}

export async function setSingle(coll, data) {
  const s = await store()
  if (s.kind === 'mongo') {
    await s.db.collection(coll).updateOne({ _key: 'single' }, { $set: { _key: 'single', ...data } }, { upsert: true })
    return data
  }
  s.db[coll] = data
  await persist()
  return data
}

export async function list(coll, filter = {}) {
  const s = await store()
  if (s.kind === 'mongo') {
    const q = {}
    if (filter.status) q.status = filter.status
    if (filter.featured !== undefined) q.featured = filter.featured === true || filter.featured === 'true'
    if (filter.q) q.title = { $regex: filter.q, $options: 'i' }
    return await s.db.collection(coll).find(q).sort({ _id: -1 }).limit(200).toArray().then(rows => rows.map(r => { delete r._id; return r }))
  }
  let rows = Array.isArray(s.db[coll]) ? [...s.db[coll]] : []
  if (filter.status) rows = rows.filter(r => r.status === filter.status)
  if (filter.featured !== undefined) rows = rows.filter(r => String(r.featured) === String(filter.featured === true || filter.featured === 'true'))
  if (filter.q) rows = rows.filter(r => (r.title || r.name || '').toLowerCase().includes(String(filter.q).toLowerCase()))
  return rows.reverse()
}

export async function getById(coll, id) {
  const s = await store()
  if (s.kind === 'mongo') {
    const doc = await s.db.collection(coll).findOne({ id })
    if (doc) delete doc._id
    return doc || null
  }
  return (s.db[coll] || []).find(r => r.id === id) || null
}

export async function insert(coll, data) {
  const s = await store()
  const doc = { id: data.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)), createdAt: new Date().toISOString(), ...data }
  if (s.kind === 'mongo') { await s.db.collection(coll).insertOne({ ...doc }); return doc }
  s.db[coll] = s.db[coll] || []
  s.db[coll].push(doc)
  await persist()
  return doc
}

export async function updateById(coll, id, data) {
  const s = await store()
  if (s.kind === 'mongo') {
    const res = await s.db.collection(coll).findOneAndUpdate({ id }, { $set: { ...data, id, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' })
    const doc = res.value
    if (doc) delete doc._id
    return doc || null
  }
  const rows = s.db[coll] || []
  const i = rows.findIndex(r => r.id === id)
  if (i < 0) return null
  rows[i] = { ...rows[i], ...data, id, updatedAt: new Date().toISOString() }
  await persist()
  return rows[i]
}

export async function removeById(coll, id) {
  const s = await store()
  if (s.kind === 'mongo') {
    const res = await s.db.collection(coll).deleteOne({ id })
    return res.deletedCount > 0
  }
  const rows = s.db[coll] || []
  const n = rows.length
  s.db[coll] = rows.filter(r => r.id !== id)
  if (s.db[coll].length !== n) { await persist(); return true }
  return false
}

export async function exportAll() {
  const s = await store()
  if (s.kind === 'mongo') {
    const out = {}
    for (const c of COLLECTIONS) {
      if (c === 'sessions') continue // jangan bocorkan session token
      const rows = await s.db.collection(c).find({}).toArray()
      out[c] = rows.map(r => { delete r._id; delete r._key; return r })
      if (SINGLE.has(c)) out[c] = out[c][0] || {}
    }
    return out
  }
  const { sessions, ...rest } = s.db
  return rest
}

export async function importAll(data) {
  const s = await store()
  const clean = { ...(data || {}) }
  delete clean.sessions // session tidak boleh di-restore
  if (s.kind === 'mongo') {
    for (const c of COLLECTIONS) {
      if (clean[c] === undefined) continue
      await s.db.collection(c).deleteMany({})
      if (SINGLE.has(c)) await s.db.collection(c).insertOne({ _key: 'single', ...clean[c] })
      else if (Array.isArray(clean[c]) && clean[c].length) await s.db.collection(c).insertMany(clean[c])
    }
    return true
  }
  for (const c of COLLECTIONS) if (clean[c] !== undefined) s.db[c] = clean[c]
  await persist()
  return true
}
