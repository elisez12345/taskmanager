export interface Member{
  _id: String
  name: String
  username: String
}

export interface TaskBoard {
  _id: String
  memberId?: String
  members?: String[]
  teamId?: String
  title: String
  adminMembers: String[]
  description?: String,
  dueDate?: Date
}

export interface Team{
  _id: String
  name: String
  members: String[]
  teamAdmins: String[]
}

export interface Task{
  _id: String
  taskBoardId: String
  title: String
  description?: String
  status: 'todo' | 'done'
}


// export interface User{
//   _id: String
//   name: String
//   email: String
//   password: String
// }

// export interface TaskBoard {
//   _id: String;
//   userId?: String;
//   teamId?: String;
//   title: String;
//   adminUsers: User[];
// }

// export interface Team{
//   _id: String
//   name: String
//   users: User[]
// }