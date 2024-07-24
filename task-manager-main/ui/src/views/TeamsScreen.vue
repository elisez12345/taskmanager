<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6" v-if="user?.roles?.includes('admin') && user?.preferred_username != null">
        <!-- Displaying existing teams -->
        <div class="row">
          <div class="col-md-6 mb-4" v-for="(team, index) in allTeams" :key="index">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ team.name }}</h5>
                <p class="card-text">Number of Members: {{ team.members.length }}</p>
                <ul class="list-unstyled">
                  <li v-for="(member, i) in team.members" :key="i">{{ member }}</li>
                </ul>
                <form @submit.prevent="addMemberToTeam(index)">
                  <div class="form-group">
                    <input
                      type="text"
                      class="form-control"
                      v-model="newMembers[index]"
                      placeholder="Enter member name"
                      required
                    />
                  </div>
                  <button type="submit" class="btn btn-primary">Add Member</button>
                </form>
                <button class="btn btn-danger mb-3" @click="deleteTeam(team._id)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Display message if no teams found -->
        <div class="col-md-12" v-if="allTeams.length === 0">
          <p>No teams found</p>
        </div>
      </div>

      <!-- Form to create a new team -->

      <!-- Display message for users with invalid permissions -->
      <div class="col-md-12" v-else>
        <div class="row">
          <div class="col-md-12" v-if="allTeams.length === 0">
            <p>No teams found</p>
          </div>
          <div class="col-md-6 mb-4" v-else v-for="(team, index) in allTeams" :key="index">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ team.name }}</h5>
                <p class="card-text">Number of Members: {{ team.members.length }}</p>
                <ul class="list-unstyled">
                  <li v-for="(member, i) in team.members" :key="i">{{ member }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body" v-if="user?.roles?.includes('admin') && user?.preferred_username != null">
        <form @submit.prevent="createNewTeam">
          <div class="form-group">
            <label for="teamName">Team Name</label>
            <input
              type="text"
              class="form-control"
              id="teamName"
              v-model="newTeam.name"
              placeholder="Enter team name"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary">Create Team</button>
          <!-- <button type="submit" class="btn btn-primary">Button Change for Test</button> -->
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref, onMounted, ref, provide } from "vue";
import { Team } from "../data";
import { v4 as uuidv4 } from "uuid";

const allTeams: Ref<Team[]> = ref([]);
const newMembers: Ref<string[]> = ref([]);

const user = ref({} as any);
provide("user", user);

const newTeam: Ref<Team> = ref({ name: "", members: [], _id: "", teamAdmins: [] });

async function refresh() {
  user.value = await (await fetch("/api/user")).json();
  if(user.value){
    try{
      const response = await fetch("/api/teams");
      if(!response.ok) {
        alert('Please login to access this page');
        return;
      }
      allTeams.value = await (await fetch("/api/teams")).json();
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      alert('An error occurred while fetching the teams.');
    }
    // user.value = await (await fetch("/api/user")).json();
    // console.log("USERRRRRRRR", user.value, user);
    //   const user_id = user.value._id;
    // console.log("check", allTeams.value);
  }
}

// find members?
// async function findMember(username) {
//     const username =
// }

async function deleteTeam(teamId: String) {
  try {
    const result = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    if (result.ok) {
      refresh(); // Refresh team data after deletion
    } else {
      console.error("Error deleting team:", result.statusText);
    }
  } catch (error) {
    console.error("Error deleting team:", error);
  }
}

async function createNewTeam() {
  try {
    const newTeamData = {
      ...newTeam.value,
      _id: uuidv4(), // Generate random UUID for _id field
      teamAdmins: [user.value.preferred_username], // Set members array with current user's preferred_username
      members: [user.value.preferred_username],
    };

    const result = await fetch(`/api/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTeamData),
    });

    if (result.ok) {
      // Refresh team data after creating the new team
      refresh();
      // Clear form fields after successful submission
      newTeam.value = { name: "", members: [], _id: "", teamAdmins: [] };
    } else {
      console.error("Error creating team:", result.statusText);
    }
  } catch (error) {
    console.error("Error creating team:", error);
  }
}

async function addMemberToTeam(index: number) {
  if (index >= 0 && index < allTeams.value.length) {
    try {
      const teamId = allTeams.value[index]._id;
      const updatedMembers = [...allTeams.value[index].members, newMembers.value[index]]; // Access newMembers using .value

      const updatedTeamData = {
        ...allTeams.value[index],
        members: updatedMembers,
      };

      const result = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTeamData),
      });

      if (result.ok) {
        refresh(); // Refresh team data after updating the team
        newMembers.value[index] = ""; // Clear new member input field
      } else {
        console.error("Error adding member to team:", result.statusText);
      }
    } catch (error) {
      console.error("Error adding member to team:", error);
    }
  }
}

onMounted(refresh);
</script>
