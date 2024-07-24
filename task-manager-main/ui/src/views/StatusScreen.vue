<template>
  <div class="mx-3 my-3">
    <b-jumbotron v-if="user?.preferred_username" :header="jumbotronHeader" class="text-center" />
    <b-jumbotron v-else header="Welcome to Task Manager" class="text-center" />
    <div style="display: flex; justify-content: center; align-items: center">
      <a v-if="user?.preferred_username == null" href="/api/login" class="btn btn-primary btn-lg"
        >Login with GitLab</a
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, provide } from "vue";
// import { Order } from "../data"

// const orders: Ref<Order[]> = ref([])

// async function refresh() {
//   orders.value = await (await fetch("/api/orders")).json()
// }
// onMounted(refresh)

const user = ref({} as any);
provide("user", user);

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json();
  console.log("USERRRRR", user.value, user);
});

const jumbotronHeader = computed(() => {
  // Check if user.value.name is not null or undefined
  if (user.value.name) {
    console.log(user.value.preferred_username);
    return `Welcome, ${user.value.name}`;
  } else {
    return "Welcome";
  }
});
</script>
