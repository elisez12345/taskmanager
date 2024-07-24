<template>
  <div>
    <b-navbar
      toggleable="lg"
      type="dark"
      :variant="user?.roles?.includes('member') ? 'info' : 'primary'"
    >
      <b-navbar-brand href="#">
        <!-- <span v-if="user?.name">Welcome, {{ user.name }}</span> -->
        <router-link to="/" class="nav-link" style="color: white; text-decoration: none"
          >Task Manager</router-link
        >
      </b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item v-if="user?.roles?.includes('admin')" >Admin View |</b-nav-item>
        <b-nav-item v-if="user?.roles?.includes('member')" >Member View |</b-nav-item>
        <b-nav-item v-if="user?.name" href="/taskboards">TaskBoards</b-nav-item>
        <b-nav-item v-if="user?.name" href="/teams">Teams</b-nav-item>
        <b-nav-item v-if="user?.name" @click="logout">Logout</b-nav-item>
        <form method="POST" action="/api/logout" id="logoutForm" />
      </b-navbar-nav>
    </b-navbar>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from "vue";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client/core";

const user = ref({} as any);
provide("user", user);

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json();
  console.log("USERRRRR", user.value, user.value.name);
});

function logout() {
  (window.document.getElementById("logoutForm") as HTMLFormElement).submit();
}

const httpLink = createHttpLink({
  // see https://studio.apollographql.com/public/SpaceX-pxxbxen/variant/current/home
  uri: "http://localhost:31001/graphql",
});
const cache = new InMemoryCache();
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});

provide(DefaultApolloClient, apolloClient);
</script>

<style scoped>
b-navbar-brand .nav-link {
  color: white !important;
  text-decoration: none !important;
}
</style>
