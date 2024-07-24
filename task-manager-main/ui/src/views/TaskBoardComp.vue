<template>
  <div class="task-board" v-if="taskBoard">
    <div v-if="loading">Loading...</div>
    <div v-else>
      <h3>{{ taskBoard.title }}</h3>
      <h4>{{ taskBoard.description }}</h4>
      <h4>{{taskBoard.dueDate}}</h4>
        <template v-if="taskBoard.members != null">
          <div> Members: {{ taskBoard.members.join(", ") }}</div>
        </template>
      <div v-for="task in result?.tasksByTeam" :key="task._id">
        <label>
          <input type="checkbox" :checked="task.status === 'done'" @change="updateTaskStatus(task, taskBoard._id)" />
          {{ task.title }}
        </label>
        
         <button class="delete-button" @click="deleteTask(task._id, taskBoard._id)">Delete</button>
      </div>
      <form @submit.prevent="addTask">
        <input type="text" v-model="newTask.title" placeholder="Task title" required>
        <button type="submit">Add Task</button>
      </form>

       <button v-if="user?.roles?.includes('admin')" @click="deleteTaskBoard(taskBoard._id)" class="btn btn-danger" style="margin-top: 20px;">Delete Task Board</button>

    </div>
  </div>
</template>


<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { TaskBoard } from "../data";
import { defineProps, ref, provide, onMounted, watch } from 'vue';
import {Task} from '../data';

const emit = defineEmits(); // Define emits

const user = ref({} as any);
provide("user", user);

async function refresh() {
    user.value = await (await fetch("/api/user")).json();
}

const loading = ref(false);
const newTask = ref({ title: '' });

const props = defineProps({
  taskBoard: Object as () => TaskBoard,
  refreshChild: Boolean,
});

watch(() => props.refreshChild, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue) {
    console.log('Refreshing child component...');
    refresh();
    refetch();
  }
});


const { mutate: updateTaskStatusMutation } = useMutation(gql`
  mutation UpdateTask($taskId: ID!, $status: String!, $taskBoardId: String) {
    updateTask(_id: $taskId, status: $status, taskBoardId: $taskBoardId) {
      _id
      taskBoardId
      title
      status
    }
  }
`);

const { result, refetch } = useQuery(gql`
  query Query($teamId: ID!) {
    tasksByTeam(teamId: $teamId) {
      title
      _id
      status
    }
  }
`, { teamId: props.taskBoard?._id }); // Assuming taskBoard has a property `teamId`


const DELETE_TASK_MUTATION = gql`
  mutation deleteTask($_id: String!, $taskBoardId: String!) {
    deleteTask(_id: $_id, taskBoardId: $taskBoardId)
  }
`;

const { mutate: deleteTaskMutation } = useMutation(DELETE_TASK_MUTATION);

async function deleteTask(taskId: string, taskBoardId: String) {
  try {
    // Call the deleteTaskMutation with the task ID
    console.log(taskBoardId)
    await deleteTaskMutation({ _id: taskId, taskBoardId: taskBoardId }); 
    refetch();
  } catch (error: any) {
    if (error.message.includes('Task board does not exist')){
      alert('This task board has been deleted by another user. Please refresh the page');
    }
    else{
      alert('Error deleting task.');
    }
    console.error('Error deleting task:', error);
    // Handle the error appropriately
  }
}


async function deleteTaskBoard(taskBoardIdToDelete: String) {
  try {
    const response = await fetch(`/api/taskboard/delete/${taskBoardIdToDelete}`, {
      method: "DELETE",
    });

    if (response.ok) {
      emit('taskBoardDeleted');
    } else {
      console.error("Error deleting TaskBoard:", response.statusText);
    }
  } catch (error) {
    console.error("Error deleting TaskBoard:", error);
  }
}

async function updateTaskStatus(task: Task, taskBoardId: String) {
  try {
    const newStatus = task.status === 'todo' ? 'done' : 'todo';
    console.log(newStatus)
    console.log(task)
    await updateTaskStatusMutation({ 
      taskId: task._id, 
      status: newStatus, 
      taskBoardId: taskBoardId });
    refetch();
  } catch (error: any) {
    if (error.message.includes('Task board does not')){
      alert('This task board has been deleted by another user. Please refresh the page');
    }
    else{
      alert('Error modifying task. Please refresh page.');
    }
    console.error('Error updating task status:', error);
  }

}


const { mutate: createTaskMutation } = useMutation(gql`
  mutation CreateTask($taskBoardId: String!, $title: String!, $status: String!) {
    createTask(taskBoardId: $taskBoardId, title: $title, status: $status) {
      title
      status
    }
  }
`);

async function addTask() {
  try {
    await createTaskMutation({
      taskBoardId: props.taskBoard?._id,
      title: newTask.value.title,
      status: 'todo',
    });
    newTask.value.title = ''; 
    refetch();
  } catch (error: any) {
    if (error.message.includes('Task board does not')){
      alert('This task board has been deleted by another user. Please refresh the page');
    }
    else{
      alert('Error modifying task. Please refresh page.');
    }
    console.error('Error adding task:', error);
  }
}


onMounted(() => {
  refresh();
});


</script>

<style scoped>
.task-board {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f7fafc;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.task-board h3 {
  margin-top: 0;
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #4a5568;
}

.task-board ul {
  list-style: none;
  padding: 0;
}

.task-board li {
  margin-bottom: 10px;
}

.task-board input[type="checkbox"] {
  margin-right: 10px;
  vertical-align: middle;
}


.delete-button {
  margin-left: 10px; /* Adjust the margin as needed */
}
</style>
