<template>
    <nav class="navbar">
      <div class="navbar-left">
        <router-link to="/">
          <span class="logo">TTP</span>
        </router-link>
      </div>
  
      <div class="navbar-right">
        <router-link
          to="/learning-path"
          class="nav-link"
          :class="{ active: isActive('/learning-path') }"
          >Learning Path</router-link
        >

        <router-link
          to="/achievement"
          class="nav-link"
          :class="{ active: isActive('/achievement') }"
          >Achievement</router-link
        >

        <router-link
          to="/profile"
          class="nav-link"
          :class="{ active: isActive('/profile') }"
          >Profile</router-link
        >
      </div>
    </nav>
  </template>
  
  <script>
  import { useRoute } from "vue-router";
  
  export default {
    name: "NavBar",
    setup() {
      const route = useRoute();
  
      const isActive = (path) => route.path === path;
  
      return { isActive };
    },
  };
  </script>
  
  <style scoped>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    height: 80px;
  }
  
  .logo {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-decoration: none;
  margin-left: 25px;
}

.navbar-left a {
  text-decoration: none;
}

  
  .navbar-right {
    display: flex;
    align-items: center;
  }
  
  .nav-link {
    padding: 5px 30px;
    text-decoration: none;
    color: #333;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .nav-link:hover {
    background-color: #f0f0f0;
    border-radius: 10px;
  }
  
  .nav-link.active {
    color: black;
    font-weight: 700;
    /* text-decoration: underline; */
    text-decoration-thickness: 2px;
    text-underline-offset: 5px;
  }
  </style>
  