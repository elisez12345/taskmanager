import { MongoClient } from 'mongodb'
import { Task, Team, TaskBoard } from './data'

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)

const taskboards: TaskBoard[] = [
  {
    _id: "A",
    memberId: "user1",
    members: ['beatriz.de.oliveira', 'user2'],
    teamId: "test1",
    title: "Board 1",
    adminMembers: [],
    description: "",
    dueDate: null,
  },
  {
    _id: "B",
    memberId: "user1",
    members: ['beatriz.de.oliveira', 'elise.zhang'],
    teamId: "test1",
    title: "Board 2",
    adminMembers: [],
    description: "",
    dueDate: null,
  },
  {
    _id: "C",
    memberId: "user2",
    members: ['user2'],
    teamId: "test2",
    title: "Board 2",
    adminMembers: [],
    description: "",
    dueDate: null,
  },
]

const teams: Team[] = [
  {
    _id: "test1",
    name: "Team One",
    members: ["anna.fan", "beatriz.de.oliveira", "user2", "elise.zhang"],
    teamAdmins: ["beatriz.de.oliveira"],
  },
]

const tasks: Task[] = [
  {
    _id: "T1",
    taskBoardId: "A",
    title: "Task1",
    status: 'todo',
  },
  {
    _id: "T2",
    taskBoardId: "A",
    title: "Task2",
    status: 'todo',
  },
  {
    _id: "T3",
    taskBoardId: "B",
    title: "Task3",
    status: 'todo',
  },
  {
    _id: "T4",
    taskBoardId: "C",
    title: "Task4",
    status: 'todo',
  },
  
]


async function main() {
  await client.connect()
  console.log('Connected successfully to MongoDB')

  const db = client.db("tracker")

  // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
  // db.collection("orders").createIndex(
  //   { customerId: 1 }, 
  //   { unique: true, partialFilterExpression: { state: "draft" } }
  // )

  // add data
  console.log("inserting teams", await db.collection("teams").insertMany(teams as any))
  console.log("inserting taskboards", await db.collection("taskboards").insertMany(taskboards as any))
  console.log("inserting tasks", await db.collection("tasks").insertMany(tasks as any))

  process.exit(0)
}

main()
