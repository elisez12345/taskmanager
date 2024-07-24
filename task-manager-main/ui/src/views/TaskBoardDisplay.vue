<template>
  <!-- <div class="col-md-6" v-if="user?.roles?.includes('admin') && user?.name != null"> -->
    <div>
      <h2>Task Boards for {{ user?.preferred_username }}</h2>
      <div v-if="loading">Loading...</div>
      <div v-else>
      <button @click="refresh">Refresh</button>
        <TaskBoardComp v-for="taskBoard in taskBoards" :taskBoard="taskBoard" :refreshChild="refreshChild" @taskBoardDeleted="refresh" />
      </div>
      <div class="new-task-board-box">
        <form v-if="user?.roles?.includes('admin') && user?.preferred_username != null" @submit.prevent="createNewTaskBoard" class="new-task-board-form">
          <input type="text" v-model="newTaskBoard.title" placeholder="Task Board Title" required>
          <input type="text" v-model="newTaskBoard.description" placeholder="Description">
          <input type="date" v-model="newTaskBoard.dueDate" placeholder="Due Date">
          <div>
            <label for="teamNames">Select Teams:</label>
            <div v-for="(team, index) in allTeams" :key="index">
              <input type="checkbox" :id="'team_' + index" :value="team.name" v-model="selectedTeams">
              <label :for="'team_' + index">{{ team.name }}</label>
            </div>
          </div>
          <div>
            <label for="memberNames">Enter Member Names (comma-separated):</label>
            <input type="text" v-model="memberNames" id="memberNames">
          </div>
          <button type="submit">Create Task Board</button>
        </form>
      </div>
      </div>
  <!-- </div> -->
  <!-- <div class="col-md-12" v-else>
          <p>Invalid Permissions</p>
  </div> -->
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from "vue";
import type { TaskBoard } from "../data.ts";
import TaskBoardComp from "./TaskBoardComp.vue";
import { v4 as uuidv4 } from 'uuid'; 

const user = ref({} as any);
provide("user", user);

const taskBoards = ref<TaskBoard[]>([]);
const loading = ref(true);

const currentDate = new Date();
const standardizedDueDate = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth(),
  currentDate.getDate()
);

const newTaskBoard = ref<TaskBoard>({
  _id: "",
  title: "",
  members: [],
  adminMembers: [],
  description: "",
  dueDate: standardizedDueDate,
});

const allTeams = ref([]) as any;
const selectedTeams = ref([]);
const memberNames = ref("");

const refreshChild = ref(false);

async function refresh() {

  refreshChild.value = true;

  user.value = await (await fetch("/api/user")).json();
  if(user.value){
    try{
      const response1 = await fetch("/api/teams");
      if(!response1.ok) {
        alert('Please login to access this page');
        return;
      }

      allTeams.value = await (await fetch("/api/teams")).json();

        const response = await (await fetch(`/api/taskboard/${user.value.preferred_username}`)).json();
        taskBoards.value = response;

  refreshChild.value = false;

      if (taskBoards.value) {
        loading.value = false;
      }

    }catch (error){
      console.error('Failed to fetch taskboards:', error);
      alert('An error occurred while fetching the taskboards.');
    }
  }
}

onMounted(refresh);



async function createNewTaskBoard() {
  try {

    const memberSet = new Set();

    // const newMembersPlusCurrent = newMembers.value.split(',').map(member => member.trim());
    // newMembersPlusCurrent.push(user.value.preferred_username)

    for (const teamName of selectedTeams.value) {
  const teamIndex = allTeams.value.findIndex((team: { name: string }) => team.name === teamName);
  if (teamIndex !== -1) {
    const teamMembers = allTeams.value[teamIndex].members;
    teamMembers.forEach((member: string) => memberSet.add(member));
  }
}
    if (memberNames.value.length > 0) {
      const names = memberNames.value.split(",").map(name => name.trim());
    names.forEach(name => memberSet.add(name));
    memberSet.add(user.value.preferred_username);

    }
    

    const newMembersPlusCurrent = Array.from(memberSet);
    
    // Generate random _id
    const newTaskBoardData = {
      ...newTaskBoard.value,
      _id: uuidv4(),
      members: newMembersPlusCurrent,
      adminMembers: [user.value.preferred_username],
    };

    const result = await fetch("/api/taskboard/new-taskboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTaskBoardData),
    });

    if (result.ok) {
      refresh();
      // Clear the form after successful submission
      newTaskBoard.value = {
        _id: "",
        title: "",
        adminMembers: [],
      };
      memberNames.value = ""; // Clear new members input field
    } else {
      console.error("Error creating TaskBoard:", result.statusText);
    }
  } catch (error) {
    console.error("Error creating TaskBoard:", error);
  }
}
</script>

<style scoped>
/* New Task Board Form */
.new-task-board-form {
  margin-top: 20px;
}

.new-task-board-form input[type="text"] {
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.new-task-board-form button {
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.new-task-board-form button:hover {
  background-color: #0056b3;
}

.new-task-board-box {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
