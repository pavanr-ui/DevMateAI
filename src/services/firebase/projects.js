/**
 * Projects repository: users/{uid}/projects.
 * Returns plain objects ({ id, ...data }) so the UI never touches Firestore types.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './index'

const projectsCol = (uid) => collection(db, 'users', uid, 'projects')

const toProject = (snap) => ({ id: snap.id, ...snap.data() })

/** Only these fields are ever sent; rules reject anything else anyway. */
function clean({ name, description = '', techStack = [] }) {
  return {
    name: name.trim(),
    description: description.trim(),
    techStack: techStack.map((t) => t.trim()).filter(Boolean),
  }
}

export async function listProjects(uid, { max = 50 } = {}) {
  const q = query(projectsCol(uid), orderBy('updatedAt', 'desc'), limitTo(max))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toProject)
}

export async function countProjects(uid) {
  const snapshot = await getCountFromServer(projectsCol(uid))
  return snapshot.data().count
}

export async function createProject(uid, input) {
  const ref = await addDoc(projectsCol(uid), {
    ...clean(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function updateProject(uid, id, input) {
  return updateDoc(doc(db, 'users', uid, 'projects', id), {
    ...clean(input),
    updatedAt: serverTimestamp(),
  })
}

export function deleteProject(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'projects', id))
}
