import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'

import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import { Task, Team, TaskBoard, Member } from './data'

import gql from "graphql-tag";
import { ApolloServer } from '@apollo/server'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { expressMiddleware } from '@apollo/server/express4'
import { readFileSync } from "fs"
import cors from 'cors'

import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { Strategy as CustomStrategy } from "passport-custom"
import { gitlab } from './secrets'

const HOST = process.env.HOST || "127.0.0.1"
const OPERATOR_GROUP_ID = "task-manager-admin"
const DISABLE_SECURITY = process.env.DISABLE_SECURITY

const passportStrategies = [
  ...(DISABLE_SECURITY ? ["disable-security"] : []),
  "oidc",
]
import { v4 as uuidv4 } from 'uuid';

// set up Mongo
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(mongoUrl)
let db: Db
let tasks: Collection<Task>
let taskboards: Collection<TaskBoard>
let teams: Collection<Team>

// set up Express
const app = express()
const port = parseInt(process.env.PORT) || 8191
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})

app.use(expressPinoLogger({ logger }))


app.use(cors({
  origin: ['https://studio.apollographql.com', 'http://localhost:31000', "http://127.0.0.1:8190"],
  credentials: true,
  methods: ['POST', 'GET']
}));

// app.use(cors());

// set up session
app.use(session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: 'mongodb://db',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
}))

declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

const typeDefs = gql(
  readFileSync("schema.graphql", {
    encoding: "utf-8",
  })
);
app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user: any, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user: any, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})

app.get('/api/login', passport.authenticate(passportStrategies, {
  successReturnToOrRedirect: "/"
}))

app.get('/api/login-callback', passport.authenticate(passportStrategies, {
  successReturnToOrRedirect: '/',
  failureRedirect: '/',
}))

function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized: Access is denied due to invalid credentials." })
    return
  }

  next()
}

function checkRole(requiredRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const roles = req.user?.roles || [];
    const hasRequiredRole = roles.some((role: string) => requiredRoles.includes(role));
    console.log("hasRequiredRole", hasRequiredRole)
    if (hasRequiredRole) {
      next(); // User has one of the required roles, proceed
    } else {
      console.log("hasRequiredRole2", hasRequiredRole)

      res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }
  };
}

app.get("/api/user", (req, res) => {
  res.json(req.user || {})
})

// app routes
app.post(
  "/api/logout",
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)
const resolvers = {
  Task: {
    id: (parent) => parent.id ?? parent._id,
  },
  Query: {
    async task(_, { id }) {
      try {
        let query = { _id: new ObjectId(id) };
        return await tasks.findOne(query);
      } catch (error) {
        console.error('Error fetching task:', error);
        throw error;
      }
    },
    async tasks(_, __, context) {
      try {
        const task = await tasks.find().toArray();
        return task;
      } catch (error) {
        console.error('Error fetching task:', error);
        throw error;
      }
    },
    async tasksByTeam(_, { teamId }, context) {
      try {
        const task = await tasks.find({ taskBoardId: teamId }).toArray();
        return task;
      } catch (error) {
        console.error('Error fetching tasks by team:', error);
        throw error;
      }
    },
  },
  Mutation: {
    async createTask(_, { taskBoardId, title, status, description }, context) {
      try {
        const taskBoardExists = await taskboards.findOne({ _id: taskBoardId });
        
        if (!taskBoardExists) {
          throw new Error('Task board does not exist');
        }

        const _id = uuidv4();
        const insert = await tasks.insertOne({ _id, taskBoardId, title, status, description });
        if (insert.acknowledged)
          return { taskBoardId, title, status, id: insert.insertedId };
        return null;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
    },
    async updateTask(_, args, context) {
      try {
        
        console.log(args)
        console.log(args.taskBoardId)

        const taskBoardExists = await taskboards.findOne({ _id: args.taskBoardId });
        
        console.log(taskBoardExists)

        if (!taskBoardExists) {
          throw new Error('Task board does not exist');
        }


        const id = args._id; // Assuming id is a string
        const query = { _id: id };
        const update = await tasks.updateOne(
          query,
          { $set: { ...args } }
        );
        if (update.acknowledged) {
          return await tasks.findOne(query);
        }
        return null;
      } catch (error) {
        console.error('Error updating task:', error);
        throw error;
      }
    },
    async deleteTask(_, { _id, taskBoardId }, context) {
      try {

        const taskBoardExists = await taskboards.findOne({ _id: taskBoardId });
        
        if (!taskBoardExists) {
          throw new Error('Task board does not exist');
        }

        const dbDelete = await tasks.deleteMany({ _id: _id });
        console.log(dbDelete)
        return dbDelete.acknowledged && dbDelete.deletedCount == 1 ? true : false;
      } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    },
  },
};


// get all taskboards
app.get("/api/taskboard", checkAuthenticated, async (req, res) => {
  
  const taskBoardsData = await taskboards.find().toArray();
  res.status(200).json(taskBoardsData);

})

// new taskboard
app.post("/api/taskboard/new-taskboard", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  const newTaskboard: TaskBoard = req.body

  const result = await taskboards.insertOne(newTaskboard);

  res.status(200).json({ status: "ok" })
})


// get taskboards with user IDs
app.get('/api/taskboard/:memberId', checkAuthenticated, async (req, res) => {
  const userId = req.params.memberId;

  try {
      // Query the database to find all task boards containing the user in the members array
      const boards = await taskboards.find({ members: userId }).toArray();

      console.log(boards)

      res.json(boards);

  } catch (error) {
      console.error('Error fetching task boards:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// get the taskboards assosciated with a certain team
app.get("/api/taskboard/team/:teamId", checkAuthenticated, async (req, res) => {

const _id = req.params.teamId;
const boards = await taskboards.find({teamId :  _id }).toArray();

res.status(200).json(boards)
})

// delete a taskboard
app.delete("/api/taskboard/delete/:taskboardId", checkAuthenticated, checkRole(["admin"]), async(req, res) => {

  const taskId = req.params.taskboardId;

  const result = await taskboards.deleteOne({ _id: taskId });

  if (result.deletedCount === 0) {
    res.status(404).json({ error: "TaskBoard not found" });
    return;
  }

  res.status(200).json({ status: "ok" });

})

// modify a taskboard
app.put("/api/taskboard/:id", checkAuthenticated, async (req, res) => {

  const taskId = req.params.id;
  const updatedTaskBoardData = req.body;

  const result = await taskboards.updateOne(
    { _id: taskId },
    { $set: updatedTaskBoardData }
  );

  if (result.modifiedCount === 0) {
    res.status(404).json({ error: "TaskBoard not found" });
    return;
  }
  res.status(200).json({ status: "ok" });
})

//get all teams associated with a user ID
app.get("/api/teams", checkAuthenticated, async (req, res) => {
  console.log( req.user)
  const memberId = req.user.preferred_username;
  const user_teams = await teams.find({ "members": memberId }).toArray();

  res.status(200).json(user_teams)
})

app.post("/api/teams", checkAuthenticated,  checkRole(["admin"]), async (req, res) => {

  const newTeam = req.body;

  const result = await teams.insertOne(newTeam);

  if (result.insertedId) {
    res.status(200).json({status: "ok"});
    return;
  }
  res.status(404).json({ error: "Team not found" });
})

// delete a team
app.delete("/api/teams/:teamId", checkAuthenticated,  checkRole(["admin"]), async(req, res) => {

  const teamId = req.params.teamId;

  const result = await teams.deleteOne({ _id: teamId });

  if (result.deletedCount === 0) {
    res.status(404).json({ error: "TaskBoard not found" });
    return;
  }

  res.status(200).json({ status: "ok" });

})

app.put("/api/teams/:teamId", checkAuthenticated,  checkRole(["admin"]), async (req, res) => {
  const teamId = req.params.teamId;
  const updatedTeamData = req.body;

  try {
    const result = await teams.updateOne(
      { _id: teamId },
      { $set: updatedTeamData }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ status: "ok" });
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// connect to Mongo
client.connect().then(async () => {
  console.log('Connected successfully to MongoDB')
  db = client.db("tracker")
  tasks = db.collection('tasks')
  taskboards = db.collection('taskboards')
  teams = db.collection('teams')


  passport.use("disable-security", new CustomStrategy((req, done) => {
    if (req.query.key !== DISABLE_SECURITY) {
      console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
      done(null, false)
    } else {
      done(null, { preferred_username: req.query.user, roles: [].concat(req.query.role), name: req.query.user})
    }
  }))
  {
    const issuer = await Issuer.discover("https://coursework.cs.duke.edu/")
    const client = new issuer.Client(gitlab)

    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      redirect_uri: 'http://localhost:31000/api/login-callback',
      state: generators.state(),

      // this forces a fresh login screen every time
      prompt: "login",
    }

    async function verify(tokenSet: any, userInfo: any, done: any) {
      logger.info("oidc " + JSON.stringify(userInfo))
      // console.log('userInfo', userInfo)
      userInfo.roles = userInfo.groups.includes(OPERATOR_GROUP_ID) ? ["admin"] : ["member"]
      return done(null, userInfo)
    }

    passport.use('oidc', new Strategy({ client, params }, verify))
  }

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });
  
  (async () => {
    await server.start();
    console.log('Server Started')
    app.use(
      '/graphql',
      express.json(),
      expressMiddleware(server)
    );
  })();

  // start server
  app.listen(port, () => {
    console.log(`Task server listening on port ${port}`)
  })

})

